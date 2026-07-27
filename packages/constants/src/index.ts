export const COOKIE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
};

export const ORG_ROLES = {
  ADMIN: "admin",
  DEVELOPER: "developer",
};

export const INVITE_EXPIRES_IN = "24h";

export const PROJECT_KEY_ROLES = {
  ANON: "anon",
  SERVICE_ROLE: "service_role",
};

export const COLUMN_TYPES = [
  "text",
  "integer",
  "bigint",
  "boolean",
  "timestamp",
  "uuid",
  "jsonb",
  "numeric",
];

export const TABLE_EDITOR_INTENT = {
  CREATE_TABLE: "CREATE_TABLE",
  DELETE_TABLE: "DELETE_TABLE",
  FETCH_TABLE: "FETCH_TABLE",
};

export type TableEditorIntent =
  (typeof TABLE_EDITOR_INTENT)[keyof typeof TABLE_EDITOR_INTENT];
