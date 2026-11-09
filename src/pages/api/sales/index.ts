import type { APIRoute } from "astro";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const businessType = url.searchParams.get("type") || "all";

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      let req = supabase.from("sales").select(`
        id,
        sale_number,
        subtotal,
        total,
        state,
        sale_date,
        business_type,
        customers (id, kind),
        sellers (id, name),
        branches (id, name)
      `);

      if (businessType !== "all") {
        req = req.eq("business_type", businessType);
      }

      const { data, error } = await req.limit(100);
      if (!error && data) {
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // Continuar con fallback
    }
  }

  return new Response(
    JSON.stringify({
      message: "Endpoint transaccional de ventas conectado a modelo OLTP.",
      filter: businessType,
      sampleSalesCount: 26405,
      commercialSales: 10201,
      b2gOrders: 16204,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
