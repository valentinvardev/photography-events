import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "~/server/auth";
import { env } from "~/env";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  if (!env.MP_CLIENT_ID || !env.NEXT_PUBLIC_BASE_URL) {
    return new Response("MP_CLIENT_ID o NEXT_PUBLIC_BASE_URL no configurados", { status: 500 });
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const callbackUrl = `${env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/connect/callback`;

  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", env.MP_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("state", state);

  redirect(url.toString());
}
