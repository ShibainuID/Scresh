export const sessionCookieName =
  process.env.SESSION_COOKIE_NAME ?? "scresh_session";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
