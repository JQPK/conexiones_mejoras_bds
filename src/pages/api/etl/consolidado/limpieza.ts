import type { APIRoute } from "astro";
import { isDwConfigured, isSupabaseConfigured, getSupabaseDw, getSupabaseOltp } from "@/lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };

    if (body.confirm !== true) {
      return new Response(
        JSON.stringify({
          error: {
            code: 400,
            message: "La limpieza del consolidado requiere confirmación explícita (confirm: true).",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let deletedRowsDw = 0;
    let deletedRowsOltp = 0;

    // 1. Limpieza en Proyecto 2 (Supabase DW - OLAP: fact_ventas)
    if (isDwConfigured()) {
      try {
        const dw = getSupabaseDw();
        const { count, error } = await dw
          .from("fact_ventas")
          .delete({ count: "exact" })
          .neq("id_fact_venta", 0);

        if (!error && typeof count === "number") {
          deletedRowsDw = count;
        }
      } catch (err) {
        console.warn("Error al limpiar fact_ventas en Supabase DW:", err);
      }
    }

    // 2. Limpieza en Proyecto 1 (Supabase OLTP: consolidated_rows)
    if (isSupabaseConfigured()) {
      try {
        const oltp = getSupabaseOltp();
        const { count, error } = await oltp
          .from("consolidated_rows")
          .delete({ count: "exact" })
          .neq("id", "");

        if (!error && typeof count === "number") {
          deletedRowsOltp = count;
        }

        // Registrar auditoría real en Supabase OLTP
        await oltp.from("audit_logs").insert({
          id: crypto.randomUUID(),
          actor_id: "admin",
          action: "ETL_CONSOLIDATED_CLEARED",
          target: "fact_ventas (DW) / consolidated_rows (OLTP)",
          result: "success",
          message: `Consolidado analítico vaciado. Filas eliminadas: ${deletedRowsDw || deletedRowsOltp}.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "active",
          demo: true,
        });
      } catch (err) {
        console.warn("Error al limpiar consolidated_rows o registrar auditoría en Supabase OLTP:", err);
      }
    }

    const totalDeleted = deletedRowsDw || deletedRowsOltp;

    return new Response(
      JSON.stringify({
        deletedRows: totalDeleted,
        deletedRowsDw,
        deletedRowsOltp,
        message: `Consolidado limpiado exitosamente en la nube de Supabase (DW: ${deletedRowsDw} filas, OLTP: ${deletedRowsOltp} filas). Fuentes originales y auditorías preservadas.`,
        cloud: true,
        clearedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Error interno al ejecutar la limpieza en Supabase.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
