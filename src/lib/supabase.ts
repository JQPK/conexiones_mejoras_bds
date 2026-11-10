import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clientes de conexión dual hacia Supabase (PostgreSQL):
 * 1. OLTP: arimana-bazar (Operaciones transaccionales)
 * 2. OLAP / DW: arimana-dw (Data Warehouse y cubos analíticos)
 */

if (typeof process !== "undefined" && !process.env.PUBLIC_SUPABASE_URL) {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(".env");
    }
  } catch {
    // .env ya cargado o no disponible
  }
}

const getEnv = (key: string): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key]!;
  }
  if (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env as Record<string, string | undefined>)[key]) {
    return (import.meta.env as Record<string, string | undefined>)[key] as string;
  }
  return "";
};

export function getOltpUrl(): string {
  return getEnv("PUBLIC_SUPABASE_URL") || getEnv("SUPABASE_URL");
}

export function getOltpKey(): string {
  return (
    getEnv("SUPABASE_SECRET_KEY") ||
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    getEnv("PUBLIC_SUPABASE_ANON_KEY") ||
    getEnv("SUPABASE_PUBLISHABLE_KEY") ||
    getEnv("SUPABASE_ANON_KEY")
  );
}

export function getDwUrl(): string {
  return getEnv("PUBLIC_SUPABASE_DW_URL") || getEnv("SUPABASE_DW_URL");
}

export function getDwKey(): string {
  return (
    getEnv("SUPABASE_DW_SECRET_KEY") ||
    getEnv("SUPABASE_DW_SERVICE_ROLE_KEY") ||
    getEnv("PUBLIC_SUPABASE_DW_ANON_KEY") ||
    getEnv("SUPABASE_DW_PUBLISHABLE_KEY")
  );
}

let oltpInstance: SupabaseClient | null = null;
let dwInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(getOltpUrl() && getOltpKey());
}

export function isDwConfigured(): boolean {
  return Boolean(getDwUrl() && getDwKey());
}

export function getSupabase(): SupabaseClient {
  return getSupabaseOltp();
}

export function getSupabaseOltp(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase OLTP no está configurado. Por favor define PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en tu .env"
    );
  }
  if (!oltpInstance) {
    oltpInstance = createClient(getOltpUrl(), getOltpKey(), {
      auth: { persistSession: false },
    });
  }
  return oltpInstance;
}

export function getSupabaseDw(): SupabaseClient {
  if (!isDwConfigured()) {
    throw new Error(
      "Supabase DW no está configurado. Por favor define PUBLIC_SUPABASE_DW_URL y SUPABASE_DW_SECRET_KEY en tu .env"
    );
  }
  if (!dwInstance) {
    dwInstance = createClient(getDwUrl(), getDwKey(), {
      auth: { persistSession: false },
    });
  }
  return dwInstance;
}
