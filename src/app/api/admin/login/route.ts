import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const secret = process.env.SESSION_SECRET ?? "";
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";

  if (!secret || !hash) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_PASSWORD_HASH and SESSION_SECRET." },
      { status: 503 },
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  if (!(await checkPassword(password, hash))) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
