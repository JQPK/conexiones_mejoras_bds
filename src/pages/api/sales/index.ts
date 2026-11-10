import type { APIRoute } from "astro";
import { isSupabaseConfigured, getSupabaseOltp } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: { code: 503, message: "Servicio no disponible, intenta más tarde." } }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabaseOltp();
    const businessType = url.searchParams.get("type") || "all";
    const limit = parseInt(url.searchParams.get("limit") ?? "2000", 10);

    let req = supabase.from("sales").select(`
      id,
      sale_number,
      subtotal,
      total,
      state,
      sale_date,
      business_type,
      customer_id,
      seller_id,
      branch_id,
      customers (id, kind),
      sellers (id, name),
      branches (id, name)
    `).limit(limit);

    if (businessType !== "all") {
      req = req.eq("business_type", businessType);
    }

    const { data, error } = await req;
    if (error) throw error;

    return new Response(JSON.stringify(data ?? []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: { code: 500, message: "Error al consultar ventas en Supabase." } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
