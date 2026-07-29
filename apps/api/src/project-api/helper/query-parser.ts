import { BadRequestException } from '@nestjs/common';
import {
  FILTER_OPERATORS,
  FilterOperator,
  RESERVED_QUERY_PARAMS,
} from '@supaforge/constants';
import { assertSafeIdentifier } from '../../common/assert-safe-identifier';

export interface ParsedQuery {
  select: string[];
  filters: FilterClause[];
  orderBy: OrderClause | null;
  limit: number;
  offset: number;
}

interface FilterClause {
  column: string;
  operator: string;
  value: string;
}

interface OrderClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

function formatSQLValue(operator: string, rawValue: string): string {
  const value = rawValue.trim();

  if (operator === 'IS') {
    return value.toUpperCase() === 'NULL' ? 'NULL' : 'NOT NULL';
  }

  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return value.toLowerCase();
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return value;
  }

  return `'${value.replace(/'/g, "''")}'`;
}

export function parseQueryParams(params: Record<string, string>): ParsedQuery {
  const filters: FilterClause[] = [];
  let select: string[] = [];
  let orderBy: OrderClause | null = null;
  let limit = 100;
  let offset = 0;

  for (const [key, rawValue] of Object.entries(params)) {
    if (Array.isArray(rawValue)) {
      throw new BadRequestException(
        `Query parameter "${key}" cannot be repeated`,
      );
    }

    const value = rawValue;

    if (RESERVED_QUERY_PARAMS.has(key)) {
      switch (key) {
        case 'select':
          select = value
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
          select.forEach((col) => assertSafeIdentifier(col, 'select column'));
          break;
        case 'order': {
          const [col, dir] = value.split('.');
          assertSafeIdentifier(col, 'order column');
          orderBy = {
            column: col,
            direction: dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
          };
          break;
        }
        case 'limit': {
          const parsedLimit = Number(value);

          if (!Number.isInteger(parsedLimit) || parsedLimit < 0) {
            throw new BadRequestException(
              'limit must be a non-negative integer',
            );
          }

          limit = Math.min(parsedLimit, 1000);
          break;
        }
        case 'offset': {
          offset = Math.max(parseInt(value, 10) || 0, 0);
          break;
        }
      }
      continue;
    }

    assertSafeIdentifier(key, 'filter column');

    const dotIdx = value.indexOf('.');
    if (dotIdx === -1) {
      throw new BadRequestException(
        `Invalid filter format for columns: ${key}`,
      );
    }

    const operator = value.slice(0, dotIdx) as FilterOperator;
    const filterValue = value.slice(dotIdx + 1);

    if (!Object.prototype.hasOwnProperty.call(FILTER_OPERATORS, operator)) {
      throw new BadRequestException(`Unsupported filter operator: ${operator}`);
    }

    filters.push({
      column: key,
      operator: FILTER_OPERATORS[operator],
      value: filterValue,
    });
  }

  return {
    select,
    filters,
    orderBy,
    limit,
    offset,
  };
}

export function buildWhereClause(filters: FilterClause[]): string {
  if (filters.length === 0) return '';

  const clauses = filters.map(({ column, operator, value }) => {
    const sqlValue = formatSQLValue(operator, value);

    if (operator === 'IS') {
      return `"${column}" IS ${sqlValue}`;
    }

    if (operator === 'LIKE' || operator === 'ILIKE') {
      return `"${column}" ${operator} ${sqlValue}`;
    }

    return `"${column}" ${operator} ${sqlValue}`;
  });

  return `WHERE ${clauses.join(' AND ')}`;
}
