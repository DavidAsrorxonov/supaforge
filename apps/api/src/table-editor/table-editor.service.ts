import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import type { ColumnType, TableColumn, TableInfo } from '@supaforge/types';
import { organizations, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateTableDto } from './dto/create-table.dto';
import { AddColumnDto } from './dto/alter-table.dto';
import { sql } from 'drizzle-orm';
import { assertSafeIdentifier } from '../common/assert-safe-identifier';

@Injectable()
export class TableEditorService {
  constructor(private drizzle: DrizzleService) {}

  private assertSafePagination(
    value: number,
    label: string,
    max = 10000,
  ): number {
    if (!Number.isInteger(value) || value < 0 || value > max) {
      throw new BadRequestException(
        `${label} must be an integer between 0 and ${max}. Current value: ${value}`,
      );
    }
    return value;
  }

  private mapPgTypeToColumnType(pgType: string): ColumnType {
    const map: Record<string, ColumnType> = {
      text: 'text',
      'character varying': 'text',
      integer: 'integer',
      boolean: 'boolean',
      bigint: 'bigint',
      'timestamp with time zone': 'timestamp',
      'timestamp without time zone': 'timestamp',
      uuid: 'uuid',
      jsonb: 'jsonb',
      numeric: 'numeric',
    };

    return map[pgType] ?? 'text';
  }

  private mapType(type: string): string {
    const map: Record<string, string> = {
      text: 'TEXT',
      integer: 'INT',
      boolean: 'BOOLEAN',
      bigint: 'BIGINT',
      timestamp: 'TIMESTAMPTZ',
      uuid: 'UUID',
      jsonb: 'JSONB',
      numeric: 'NUMERIC',
    };

    return map[type] ?? 'TEXT';
  }

  private formatDefault(value: string, type: ColumnType): string {
    const trim = value.trim();

    if (!trim) return '';

    if (/^(now\(\)|gen_random_uuid\(\)|current_timestamp)$/i.test(trim)) {
      return trim;
    }

    if (type === 'boolean') return trim;
    if (type === 'numeric' || type === 'bigint' || type === 'integer')
      return trim;
    if (type === 'jsonb') return `'${trim.replace(/'/g, "''")}'::jsonb`;

    return `'${trim.replace(/'/g, "''")}'`;
  }

  private async getProjectSchema(
    orgSlug: string,
    projectSlug: string,
  ): Promise<string> {
    const [row] = await this.drizzle.db
      .select({ dbSchema: projects.dbSchema })
      .from(projects)
      .innerJoin(organizations, eq(projects.orgId, organizations.id))
      .where(
        and(eq(organizations.slug, orgSlug), eq(projects.slug, projectSlug)),
      )
      .limit(1);

    if (!row) throw new NotFoundException('Project not found');
    return row.dbSchema;
  }

  private isMissingTableError(err: unknown): boolean {
    const code =
      err &&
      typeof err === 'object' &&
      'cause' in err &&
      err.cause &&
      typeof err.cause === 'object' &&
      'code' in err.cause
        ? String(err.cause.code)
        : null;

    return code === '42P01';
  }

  async getTables(orgSlug: string, projectSlug: string): Promise<string[]> {
    const schema = await this.getProjectSchema(orgSlug, projectSlug);

    const result = await this.drizzle.db.execute<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE' ORDER BY table_name ASC`,
    );

    return result.rows.map((row) => row.table_name);
  }

  async getTableInfo(
    orgSlug: string,
    projectSlug: string,
    tableName: string,
  ): Promise<TableInfo> {
    assertSafeIdentifier(tableName, 'table name');
    const schema = await this.getProjectSchema(orgSlug, projectSlug);

    const columnResult = await this.drizzle.db.execute<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>(
      `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = '${tableName}' ORDER by ordinal_position ASC`,
    );

    const pkResults = await this.drizzle.db.execute<{ column_name: string }>(
      `SELECT kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = '${schema}' AND tc.table_name = '${tableName}'`,
    );

    const pkColumns = new Set(pkResults.rows.map((row) => row.column_name));

    const fkResult = await this.drizzle.db.execute<{
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(
      `SELECT kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = '${schema}' AND tc.table_name = '${tableName}'`,
    );

    const fkMap = new Map(
      fkResult.rows.map((r) => [
        r.column_name,
        { table: r.foreign_table_name, column: r.foreign_column_name },
      ]),
    );

    const columns: TableColumn[] = columnResult.rows.map((col) => ({
      name: col.column_name,
      type: this.mapPgTypeToColumnType(col.data_type),
      isNullable: col.is_nullable === 'YES',
      isPrimaryKey: pkColumns.has(col.column_name),
      defaultValue: col.column_default,
      foreignKey: fkMap.get(col.column_name) ?? null,
    }));

    if (columns.length === 0)
      throw new NotFoundException(`Table "${tableName}" not found`);

    return {
      name: tableName,
      columns,
    };
  }

  async getTableRows(
    orgSlug: string,
    projectSlug: string,
    tableName: string,
    limit = 100,
    offset = 0,
  ): Promise<{ rows: Record<string, unknown>[]; count: number }> {
    assertSafeIdentifier(tableName, 'table name');
    const schema = await this.getProjectSchema(orgSlug, projectSlug);

    try {
      const safeLimit = this.assertSafePagination(limit, 'limit', 1000);
      const safeOffset = this.assertSafePagination(offset, 'offset');

      const [rowsResult, countResult] = await Promise.all([
        this.drizzle.db.execute<Record<string, unknown>>(
          `SELECT * FROM "${schema}"."${tableName}" LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        ),
        this.drizzle.db.execute<{ count: string }>(
          `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`,
        ),
      ]);

      return {
        rows: rowsResult.rows,
        count: parseInt(countResult.rows[0]?.count ?? '0', 10),
      };
    } catch (err) {
      if (this.isMissingTableError(err)) {
        throw new NotFoundException(`Table "${tableName}" not found`);
      }
      throw err;
    }
  }

  async createTable(
    orgSlug: string,
    projectSlug: string,
    dto: CreateTableDto,
  ): Promise<void> {
    assertSafeIdentifier(dto.name, 'table name');

    if (!dto.columns || dto.columns.length === 0) {
      throw new BadRequestException(
        'At least one column is required to create a table',
      );
    }

    const schema = await this.getProjectSchema(orgSlug, projectSlug);

    const pkCols = dto.columns.filter((col) => col.isPrimaryKey);

    const columnDefs = dto.columns.map((col) => {
      assertSafeIdentifier(col.name, 'column name');

      if (col.foreignKeyTable) {
        assertSafeIdentifier(col.foreignKeyTable, 'foreign key table');
      }

      if (col.foreignKeyColumn) {
        assertSafeIdentifier(col.foreignKeyColumn, 'foreign key column');
      }

      const parts: string[] = [];
      let colDef = `"${col.name}" ${this.mapType(col.type)}`;

      if (col.isPrimaryKey && col.type === 'bigint' && !col.defaultValue) {
        colDef += ' GENERATED BY DEFAULT AS IDENTITY';
      }

      parts.push(colDef);

      if (col.isPrimaryKey && pkCols.length === 1) parts.push('PRIMARY KEY');
      if (!col.isNullable && !col.isPrimaryKey) parts.push('NOT NULL');
      if (col.defaultValue)
        parts.push(`DEFAULT ${this.formatDefault(col.defaultValue, col.type)}`);

      return parts.join(' ');
    });

    const pkConstraints =
      pkCols.length > 1
        ? `PRIMARY KEY (${pkCols.map((c) => `"${c.name}"`).join(', ')})`
        : null;

    const fkConstraints = dto.columns
      .filter((col) => col.foreignKeyTable && col.foreignKeyColumn)
      .map(
        (col) =>
          `FOREIGN KEY ("${col.name}") REFERENCES "${schema}"."${col.foreignKeyTable}" ("${col.foreignKeyColumn}")`,
      );

    const allDefs = [
      ...columnDefs,
      ...(pkConstraints ? [pkConstraints] : []),
      ...fkConstraints,
    ].join(', ');

    await this.drizzle.db.execute(
      `CREATE TABLE "${schema}"."${dto.name}" (${allDefs})`,
    );
  }

  async deleteTable(
    orgSlug: string,
    projectSlug: string,
    tableName: string,
  ): Promise<void> {
    assertSafeIdentifier(tableName, 'table name');
    const schema = await this.getProjectSchema(orgSlug, projectSlug);
    await this.drizzle.db.execute(
      `DROP TABLE IF EXISTS "${schema}"."${tableName}"`,
    );
  }

  async addColumn(
    orgSlug: string,
    projectSlug: string,
    tableName: string,
    dto: AddColumnDto,
  ): Promise<void> {
    assertSafeIdentifier(tableName, 'table name');
    assertSafeIdentifier(dto.name, 'column name');

    const schema = await this.getProjectSchema(orgSlug, projectSlug);

    let colDef = `"${dto.name}" ${this.mapType(dto.type)}`;
    if (dto.defaultValue) {
      colDef += ` DEFAULT ${this.formatDefault(dto.defaultValue, dto.type)}`;
    }

    await this.drizzle.db.execute(
      `ALTER TABLE "${schema}"."${tableName}" ADD COLUMN ${colDef}`,
    );
  }

  async dropColumn(
    orgSlug: string,
    projectSlug: string,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    assertSafeIdentifier(tableName, 'table name');
    assertSafeIdentifier(columnName, 'column name');

    const schema = await this.getProjectSchema(orgSlug, projectSlug);

    await this.drizzle.db.execute(
      `ALTER  TABLE "${schema}"."${tableName}" DROP COLUMN "${columnName}"`,
    );
  }

  async updateRow(
    orgSlug: string,
    projectSlug: string,
    tableName: string,
    pkColumn: string,
    pkValue: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    assertSafeIdentifier(tableName, 'table name');
    assertSafeIdentifier(pkColumn, 'primary key column');

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException(
        'At least one column must be provided to update',
      );
    }

    Object.keys(updates).forEach((col) => {
      assertSafeIdentifier(col, 'column name');
    });

    const schema = await this.getProjectSchema(orgSlug, projectSlug);

    const setFragments = Object.entries(updates).map(
      ([col, val]) => sql`${sql.identifier(col)} = ${val}`,
    );

    await this.drizzle.db.execute(
      sql`UPDATE ${sql.identifier(schema)}.${sql.identifier(tableName)} SET ${sql.join(setFragments, ', ')} WHERE ${sql.identifier(pkColumn)} = ${pkValue}`,
    );
  }
}
