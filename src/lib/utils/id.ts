import { nanoid } from "nanoid";

/** Short, URL-safe unique id. */
export const uid = (size = 12) => nanoid(size);

/** RFC4122 v4 UUID (used for database primary keys). */
export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
