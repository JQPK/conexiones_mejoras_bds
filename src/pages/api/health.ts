import type { APIRoute } from "astro";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const supabaseActive = isSupabaseConfigured();
  let dbStatus = "IndexedDB (Modo Local / Demostración)";
  let connected = false;

  if (supabaseActive) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("users").select("id").limit(1);
      if (!error) {
        dbStatus = "Supabase PostgreSQL (Conectado exitosamente)";
        connected = true;
      } else {
        dbStatus = `Supabase PostgreSQL (Error de consulta: ${error.message})`;
      }
    } catch (e) {
      dbStatus = `Supabase PostgreSQL (Error de conexión: ${e instanceof Error ? e.message : String(e)})`;
    }
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabaseConfigured: supabaseActive,
      connectedToRemoteDb: connected,
      activeDatabase: dbStatus,
      environment: process.env.NODE_ENV || "development",
      models: {
        oltp: "ARIMANA_OLTP",
        olap: "ARIMANA_DW",
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
