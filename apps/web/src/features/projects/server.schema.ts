import { z } from "zod";
import { PROJECT_INTENT } from "./constants";
import { createProjectSchema } from "./client.schema";

export const projectsServerSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal(PROJECT_INTENT.CREATE),
    ...createProjectSchema.shape,
  }),
]);
