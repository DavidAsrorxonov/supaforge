import apiClient from "@/lib/axios";
import { retrieveTokenFromCookie } from "@/server-utils/utils";
import { COOKIE_KEYS } from "@supaforge/constants";
import { Project } from "@supaforge/types";
import { redirect } from "next/navigation";

function authHeaders(token: string) {
  return {
    headers: { Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}` },
  };
}

export async function retrieveTablesFromApi(
  orgSlug: string,
  projectSlug: string,
): Promise<string[]> {
  const token = await retrieveTokenFromCookie();

  try {
    const { data } = await apiClient.get<string[]>(
      `/orgs/${orgSlug}/projects/${projectSlug}/tables`,
      authHeaders(token),
    );

    return data;
  } catch {
    redirect(`/organizations/${orgSlug}/projects`);
  }
}

export async function retrieveProjectDbSchema(
  orgSlug: string,
  projectSlug: string,
): Promise<string> {
  const token = await retrieveTokenFromCookie();

  try {
    const { data } = await apiClient.get<{ projects: Project }>(
      `/orgs/${orgSlug}/projects/${projectSlug}`,
      authHeaders(token),
    );

    return data.projects.dbSchema;
  } catch {
    redirect(`/organizations/${orgSlug}/projects`);
  }
}
