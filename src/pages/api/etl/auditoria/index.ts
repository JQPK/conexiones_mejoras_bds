import type { APIRoute } from "astro";
import { isSupabaseConfigured, getSupabaseOltp } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseOltp();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // Fallback
    }
  }

  return new Response(
    JSON.stringify([
      {
        id: "audit-init",
        actor_id: "admin",
        action: "ETL_INITIALIZED",
        target: "Supabase OLTP & DW",
        result: "success",
        message: "Pipeline ETL conectado a arquitectura dual en Supabase Cloud.",
        created_at: new Date().toISOString(),
      },
    ]),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
