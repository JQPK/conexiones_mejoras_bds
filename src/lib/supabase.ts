import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de conexión hacia Supabase (PostgreSQL).
 * Soporta variables de entorno estándar de Astro y Node:
 * - PUBLIC_SUPABASE_URL o SUPABASE_URL
 * - PUBLIC_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY
 */

const getEnv = (key: string): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key]!;
  }
  // @ts-expect-error import.meta.env es provisto por Vite / Astro
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    // @ts-expect-error import.meta.env es provisto por Vite / Astro
    return import.meta.env[key] as string;
  }
  return "";
};

const supabaseUrl = getEnv("PUBLIC_SUPABASE_URL") || getEnv("SUPABASE_URL");
const supabaseKey =
  getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
  getEnv("PUBLIC_SUPABASE_ANON_KEY") ||
  getEnv("SUPABASE_ANON_KEY");

let clientInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase no está configurado. Por favor define PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en tu archivo .env"
    );
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return clientInstance;
}
