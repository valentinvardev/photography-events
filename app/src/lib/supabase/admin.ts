import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

let _client: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (!_client) {
    _client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

export async function createSignedUrl(storageKey: string, expiresIn: number): Promise<string | null> {
  if (storageKey.startsWith("http")) return storageKey;
  const client = getAdminClient();
  if (!client) return null;
  const { data } = await client.storage.from("photos").createSignedUrl(storageKey, expiresIn);
  return data?.signedUrl ?? null;
}
