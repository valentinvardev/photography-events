import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "~/server/auth";
import { env } from "~/env";
import { db } from "~/server/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("mp_oauth_state")?.value;
  cookieStore.delete("mp_oauth_state");

  if (!state || !savedState || state !== savedState) {
    redirect("/admin/configuracion?mp=error");
  }

  if (error ?? !code) {
    redirect("/admin/configuracion?mp=error");
  }

  const callbackUrl = `${env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/connect/callback`;

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.MP_CLIENT_ID,
      client_secret: env.MP_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    redirect("/admin/configuracion?mp=error");
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    user_id?: number;
  };

  await db.setting.upsert({
    where: { key: "mp_access_token" },
    update: { value: data.access_token },
    create: { key: "mp_access_token", value: data.access_token },
  });

  if (data.refresh_token) {
    await db.setting.upsert({
      where: { key: "mp_refresh_token" },
      update: { value: data.refresh_token },
      create: { key: "mp_refresh_token", value: data.refresh_token },
    });
  }

  if (data.user_id) {
    await db.setting.upsert({
      where: { key: "mp_user_id" },
      update: { value: String(data.user_id) },
      create: { key: "mp_user_id", value: String(data.user_id) },
    });
  }

  redirect("/admin/configuracion?mp=connected");
}
