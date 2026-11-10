import type { APIRoute } from "astro";
import { isDwConfigured, getSupabaseDw } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  if (!isDwConfigured()) {
    return new Response(JSON.stringify({ error: { code: 503, message: "Servicio no disponible, intenta más tarde." } }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const dw = getSupabaseDw();
    const businessType = url.searchParams.get("type") || "all";

    let query = dw.from("fact_ventas").select(`
      id_fact_venta,
      tipo_negocio,
      importe_total,
      costo_total,
      utilidad_bruta,
      cantidad,
      fuente_origen
    `);

    if (businessType !== "all") {
      query = query.eq("tipo_negocio", businessType);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const totalAmount = rows.reduce((acc, row) => acc + Number(row.importe_total || 0), 0);
    const totalProfit = rows.reduce((acc, row) => acc + Number(row.utilidad_bruta || 0), 0);
    const transactions = rows.length;
    const averageTicket = transactions > 0 ? totalAmount / transactions : 0;
    const marginPct = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

    return new Response(
      JSON.stringify({
        metrics: {
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          marginPct: Math.round(marginPct * 100) / 100,
          transactions,
          averageTicket: Math.round(averageTicket * 100) / 100,
        },
        source: "Proyecto 2: Supabase ARIMANA_DW (fact_ventas)",
        count: transactions,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: { code: 500, message: "Error al consultar analítica en Supabase DW." } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
