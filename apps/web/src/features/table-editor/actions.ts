"use server";

import { COOKIE_KEYS, TABLE_EDITOR_INTENT } from "@supaforge/constants";
import { TableInfo } from "@supaforge/types";
import { revalidatePath } from "next/cache";
import { tableEditorServerSchema } from "./server.schema";
import { retrieveTokenFromCookie } from "@/server-utils/utils";
import apiClient from "@/lib/axios";

export type TableEditorActionState = {
  error?: string;
  success?: string;
  tableName?: string;
  tableData?: {
    info: TableInfo;
    rows: Record<string, unknown>[];
    count: number;
  };
};

type TableEditorCtx = {
  orgSlug: string;
  projectSlug: string;
};

function authHeaders(token: string) {
  return { headers: { Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}` } };
}

function basePath(orgSlug: string, projectSlug: string) {
  return `/orgs/${orgSlug}/projects/${projectSlug}/tables`;
}

function revalidateDatabase(orgSlug: string, projectSlug: string) {
  revalidatePath(`/organizations/${orgSlug}/${projectSlug}/database`);
}

export async function tableEditorAction(
  { orgSlug, projectSlug }: TableEditorCtx,
  _prev: TableEditorActionState,
  formData: FormData,
): Promise<TableEditorActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = tableEditorServerSchema.safeParse(raw);

  if (!parsed.success)
    return { error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };

  const token = await retrieveTokenFromCookie();
  const { intent } = parsed.data;
  const base = basePath(orgSlug, projectSlug);
  const opts = authHeaders(token);

  try {
    switch (intent) {
      case TABLE_EDITOR_INTENT.CREATE_TABLE: {
        const { name, columns } = parsed.data;
        await apiClient.post(base, { name, columns }, opts);
        revalidateDatabase(orgSlug, projectSlug);
        return { success: "Table created", tableName: name };
      }

      case TABLE_EDITOR_INTENT.DELETE_TABLE: {
        const { tableName } = parsed.data;
        await apiClient.delete(`${base}/${tableName}`, opts);
        revalidateDatabase(orgSlug, projectSlug);
        return { success: "Table deleted", tableName };
      }

      case TABLE_EDITOR_INTENT.FETCH_TABLE: {
        const { tableName } = parsed.data;
        const [infoRes, rowRes] = await Promise.all([
          apiClient.get<TableInfo>(`${base}/${tableName}`, opts),
          apiClient.get<{ rows: Record<string, unknown>[]; count: number }>(
            `${base}/${tableName}/rows?limit=100`,
            opts,
          ),
        ]);

        return {
          tableData: {
            info: infoRes.data,
            rows: rowRes.data.rows,
            count: rowRes.data.count,
          },
          tableName,
        };
      }

      default: {
        return { error: "Invalid intent" };
      }
    }
  } catch {
    return { error: "Something went wrong" };
  }
}
