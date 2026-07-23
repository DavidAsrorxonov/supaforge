import { redirect } from "next/navigation";
import type { OrganizationMeta } from "@supaforge/types";
import { retrieveTokenFromCookie } from "@/server-utils/utils";
import apiClient from "@/lib/axios";
import { COOKIE_KEYS } from "@supaforge/constants";

export async function retrieveMyOrgFromApi(): Promise<OrganizationMeta[]> {
  const token = await retrieveTokenFromCookie();

  try {
    const { data } = await apiClient.get<OrganizationMeta[]>("/orgs", {
      headers: {
        Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}`,
      },
    });

    return data;
  } catch (error) {
    redirect("/login");
  }
}

export async function retrieveOrgBySlugFromApi(slug: string) {
  const token = await retrieveTokenFromCookie();

  try {
    const { data } = await apiClient.get<OrganizationMeta>(`/orgs/${slug}`, {
      headers: {
        Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}`,
      },
    });

    return data;
  } catch (error) {
    redirect("/organizations");
  }
}
