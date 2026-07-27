import { TABLE_EDITOR_INTENT } from "@supaforge/constants";
import { z } from "zod";
import {
  createTableSchema,
  deleteTableSchema,
  fetchTableSchema,
} from "./client.schema";

export const tableEditorServerSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal(TABLE_EDITOR_INTENT.CREATE_TABLE),
    name: createTableSchema.shape.name,
    columns: z.string().transform((raw, ctx) => {
      try {
        const parsed: unknown = JSON.parse(raw);
        const result = createTableSchema.shape.columns.safeParse(parsed);

        if (!result.success) {
          ctx.addIssue({ code: "custom", message: "Invalid columns" });
          return z.NEVER;
        }

        return result.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid columns" });
        return z.NEVER;
      }
    }),
  }),
  z.object({
    intent: z.literal(TABLE_EDITOR_INTENT.DELETE_TABLE),
    ...deleteTableSchema.shape,
  }),
  z.object({
    intent: z.literal(TABLE_EDITOR_INTENT.FETCH_TABLE),
    ...fetchTableSchema.shape,
  }),
]);
