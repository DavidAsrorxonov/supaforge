// import { ORG_ROLES } from "@supaforge/constants";
import { InviteMemberInput, UpdateRoleInput } from "@supaforge/types";
import { z } from "zod";

export const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
}) satisfies z.ZodType<InviteMemberInput>;

export const updateRoleSchema = z.object({
  role: z.enum(["developer", "admin"]),
}) satisfies z.ZodType<UpdateRoleInput>;
