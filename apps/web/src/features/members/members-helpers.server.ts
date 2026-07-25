import apiClient from "@/lib/axios";
import { retrieveTokenFromCookie } from "@/server-utils/utils";
import { COOKIE_KEYS } from "@supaforge/constants";
import { OrgMemberWithUser } from "@supaforge/types";
import { redirect } from "next/navigation";

export async function retrieveMembersFromApi(
  slug: string,
): Promise<OrgMemberWithUser[]> {
  const token = await retrieveTokenFromCookie();

  try {
    const { data } = await apiClient.get<OrgMemberWithUser[]>(
      `/orgs/${slug}/members`,
      { headers: { Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}` } },
    );

    return data;
  } catch {
    redirect("/organizations");
  }
}
