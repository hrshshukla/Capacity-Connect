import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
  type User,
} from "@supabase/supabase-js";
import WebSocket from "ws";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set.`);
  return value;
}

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;
const realtimeTransport = WebSocket as unknown as NonNullable<
  SupabaseClientOptions<any>["realtime"]
>["transport"];

export function getSupabasePublicClient() {
  if (!publicClient) {
    publicClient = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: realtimeTransport },
    });
  }
  return publicClient;
}

export function getSupabaseAdminClient() {
  if (!adminClient) {
    adminClient = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: realtimeTransport },
    });
  }
  return adminClient;
}

export async function getSupabaseUser(accessToken: string): Promise<User | null> {
  const { data, error } = await getSupabasePublicClient().auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

export function supabaseUserMetadata(user: User) {
  return (user.user_metadata ?? {}) as Record<string, unknown>;
}