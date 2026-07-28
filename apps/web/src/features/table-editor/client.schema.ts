import { COLUMN_TYPES } from "@supaforge/constants";
import { ColumnType, CreateTableInput } from "@supaforge/types";
import { z } from "zod";

export const createColumnSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(COLUMN_TYPES as [ColumnType, ...ColumnType[]]),
  isNullable: z.boolean(),
  isPrimaryKey: z.boolean(),
  defaultValue: z.string().optional(),
  foreignKeyTable: z.string().optional(),
  foreignKeyColumn: z.string().optional(),
});

export const createTableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  columns: z
    .array(createColumnSchema)
    .min(1, "At least one column is required"),
}) satisfies z.ZodType<CreateTableInput>;

export const fetchTableSchema = z.object({
  tableName: z.string().min(1, "Table name is required"),
});

export const deleteTableSchema = z.object({
  tableName: z.string().min(1, "Table name is required"),
});

export const addColumnSchema = z.object({
  tableName: z.string().min(1, "Table name is required"),
  name: z
    .string()
    .min(1, "Column name is required")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid column name"),
  type: z.enum(COLUMN_TYPES),
  defaultValue: z.string().optional(),
});
