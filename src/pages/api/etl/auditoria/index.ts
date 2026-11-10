import type { APIRoute } from "astro";
import { getSupabaseOltp, isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: { code: 503, message: "Servicio no disponible, intenta más tarde." } }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = getSupabaseOltp();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return new Response(JSON.stringify(data ?? []), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: { code: 500, message: "Error al consultar auditoría." } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
