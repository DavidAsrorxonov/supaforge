"use server";

import { retrieveTokenFromCookie } from "@/server-utils/utils";
import { membersServerSchema } from "./server.schema";
import { MEMBERS_INTENT } from "./constants";
import apiClient from "@/lib/axios";
import { COOKIE_KEYS } from "@supaforge/constants";
import { revalidatePath } from "next/cache";

export type MembersActionState = {
  error?: string;
  success?: string;
};

export async function membersAction(
  { slug }: { slug: string },
  _prev: MembersActionState,
  formData: FormData,
): Promise<MembersActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = membersServerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
  }

  const token = await retrieveTokenFromCookie();
  const { intent, ...data } = parsed.data;

  try {
    switch (intent) {
      case MEMBERS_INTENT.INVITE: {
        await apiClient.post(
          `/orgs/${slug}/members/invite`,
          { email: (data as { email: string }).email },
          { headers: { Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}` } },
        );

        revalidatePath(`/organizations/${slug}/settings/members`);
        return { success: "Invite sent" };
      }

      case MEMBERS_INTENT.UPDATE_ROLE: {
        const { memberId, role } = data as { memberId: string; role: string };

        await apiClient.patch(
          `/orgs/${slug}/members/${memberId}/role`,
          { role },
          {
            headers: {
              Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}`,
            },
          },
        );

        revalidatePath(`/organizations/${slug}/settings/members`);
        return { success: "Role updated" };
      }

      case MEMBERS_INTENT.REMOVE: {
        const { memberId } = data as { memberId: string };
        await apiClient.delete(`/orgs/${slug}/members/${memberId}`, {
          headers: {
            Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}`,
          },
        });

        revalidatePath(`/organizations/${slug}/settings/members`);
        return { success: "Member removed" };
      }

      default: {
        return { error: "Invalid intent" };
      }
    }
  } catch (err) {
    return { error: "Cannot remove or denote the last admin" };
  }
}
