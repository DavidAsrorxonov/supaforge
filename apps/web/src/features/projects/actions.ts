"use server";

import { retrieveTokenFromCookie } from "@/server-utils/utils";
import { projectsServerSchema } from "./server.schema";
import { PROJECT_INTENT } from "./constants";
import apiClient from "@/lib/axios";
import { COOKIE_KEYS } from "@supaforge/constants";
import { revalidatePath } from "next/cache";

export type ProjectsActionState = {
  error?: string;
  success?: string;
};

export async function projectsAction(
  { slug }: { slug: string },
  _prev: ProjectsActionState,
  formData: FormData,
): Promise<ProjectsActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = projectsServerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "Invalid input" };
  }

  const token = await retrieveTokenFromCookie();
  const { intent, ...data } = parsed.data;

  try {
    switch (intent) {
      case PROJECT_INTENT.CREATE: {
        await apiClient.post(
          `/orgs/${slug}/projects`,
          { name: (data as { name: string }).name },
          { headers: { Cookie: `${COOKIE_KEYS.ACCESS_TOKEN}=${token}` } },
        );

        revalidatePath(`/organizations/${slug}/projects`);
        return { success: "Project created" };
      }

      default:
        return { error: "Invalid intent" };
    }
  } catch {
    return { error: "Something went wrong" };
  }
}
