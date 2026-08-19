import { http } from "../../../shared/api/httpClient";
import type { User } from "../types/auth.types";

export function signIn(input: { name: string; email: string }) {
  return http<{ user: User }>("/session", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getSession() {
  return http<{ user: User | null }>("/session");
}

export function signOut() {
  return http<void>("/session", { method: "DELETE" });
}
