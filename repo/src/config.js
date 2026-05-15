const envApi = import.meta.env.VITE_API_BASE_URL;
const envUserId = import.meta.env.VITE_USER_ID;

export const API_BASE_URL = envApi?.trim() || "https://upstageaidemo-production.up.railway.app";
export const DEFAULT_USER_ID =
  envUserId?.trim() || "00000000-0000-0000-0000-000000000001";

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (value) => UUID_REGEX.test(value ?? "");
