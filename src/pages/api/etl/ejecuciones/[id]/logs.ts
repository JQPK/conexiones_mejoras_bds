import type { APIRoute } from "astro";
import { isSupabaseConfigured, getSupabaseOltp } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  const executionId = id || "exec_01";

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseOltp();
      const { data, error } = await supabase
        .from("etl_executions")
        .select("id, log, started_at, completed_at, state")
        .eq("id", executionId)
        .single();

      if (!error && data) {
        const messages = Array.isArray(data.log) ? data.log : [String(data.log || "Sin logs")];
        return new Response(
          JSON.stringify({
            executionId: data.id,
            events: [
              {
                id: crypto.randomUUID(),
                timestamp: data.started_at,
                level: "info",
                stage: "extract",
                message: `Inicio de ejecución registrado en Supabase OLTP.`,
              },
              {
                id: crypto.randomUUID(),
                timestamp: data.completed_at || data.started_at,
                level: data.state === "completed" ? "info" : "error",
                stage: "load",
                message: `Estado final en nube: ${data.state}.`,
              },
            ],
            messages,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch {
      // Fallback
    }
  }

  return new Response(
    JSON.stringify({
      executionId,
      events: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          level: "info",
          stage: "extract",
          message: "Extracción completada sin incidentes.",
        },
      ],
      messages: ["[extract] Extracción de fuentes finalizada.", "[load] Consolidado completado."],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
