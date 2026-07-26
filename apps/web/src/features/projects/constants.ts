export const PROJECT_INTENT = {
  CREATE: "CREATE",
};

export type ProjectsIntent =
  (typeof PROJECT_INTENT)[keyof typeof PROJECT_INTENT];
