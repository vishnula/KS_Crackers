import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(
    store.get(SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET ?? "",
  );
}

// Every admin page and mutating admin route calls this first.
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) redirect("/admin/login");
}
