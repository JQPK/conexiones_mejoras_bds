import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clientes de conexión dual hacia Supabase (PostgreSQL):
 * 1. OLTP: arimana-bazar (Operaciones transaccionales)
 * 2. OLAP / DW: arimana-dw (Data Warehouse y cubos analíticos)
 */

const getEnv = (key: string): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key]!;
  }
  // @ts-expect-error import.meta.env provisto por Vite / Astro
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    // @ts-expect-error import.meta.env provisto por Vite / Astro
    return import.meta.env[key] as string;
  }
  return "";
};

// 1. Configuración OLTP
const oltpUrl = getEnv("PUBLIC_SUPABASE_URL") || getEnv("SUPABASE_URL");
const oltpKey =
  getEnv("SUPABASE_SECRET_KEY") ||
  getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
  getEnv("PUBLIC_SUPABASE_ANON_KEY") ||
  getEnv("SUPABASE_PUBLISHABLE_KEY") ||
  getEnv("SUPABASE_ANON_KEY");

// 2. Configuración OLAP / DW
const dwUrl =
  getEnv("PUBLIC_SUPABASE_DW_URL") ||
  getEnv("SUPABASE_DW_URL");
const dwKey =
  getEnv("SUPABASE_DW_SECRET_KEY") ||
  getEnv("SUPABASE_DW_SERVICE_ROLE_KEY") ||
  getEnv("PUBLIC_SUPABASE_DW_ANON_KEY") ||
  getEnv("SUPABASE_DW_PUBLISHABLE_KEY");

let oltpInstance: SupabaseClient | null = null;
let dwInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(oltpUrl && oltpKey);
}

export function isDwConfigured(): boolean {
  return Boolean(dwUrl && dwKey);
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
    oltpInstance = createClient(oltpUrl, oltpKey, {
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
    dwInstance = createClient(dwUrl, dwKey, {
      auth: { persistSession: false },
    });
  }
  return dwInstance;
}
