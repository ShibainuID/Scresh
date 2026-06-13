"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/domain/auth";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookies";
import { loginSchema, registerSchema } from "@/lib/auth/validation";
import { services } from "@/lib/server/services/container";

export async function loginAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const result = await services.auth.login(parsed.data);

  if (!result.ok) {
    return { message: result.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, result.token, {
    ...sessionCookieOptions,
    expires: result.session.expiresAt,
  });

  redirect(services.rbac.getPrimaryHome(result.session));
}

export async function registerAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "staff",
    cooperativeName: formData.get("cooperativeName"),
    cooperativeLegalName:
      formData.get("cooperativeLegalName") || formData.get("cooperativeName"),
    cooperativeRegistrationNumber: formData.get("cooperativeRegistrationNumber"),
    cooperativeAddress: formData.get("cooperativeAddress"),
    cooperativeCity: formData.get("cooperativeCity"),
    cooperativeProvince: formData.get("cooperativeProvince"),
    cooperativeContactPhone: formData.get("cooperativeContactPhone"),
    commodityFocus: formData.get("commodityFocus"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const result = await services.auth.register(parsed.data);

  if (!result.ok) {
    return { message: result.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, result.token, {
    ...sessionCookieOptions,
    expires: result.session.expiresAt,
  });

  redirect(services.rbac.getPrimaryHome(result.session));
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  await services.auth.logout(token);
  cookieStore.delete(sessionCookieName);
  redirect("/login");
}
