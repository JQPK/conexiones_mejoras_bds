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
    const query = url.searchParams.get("q") || "";
    const limit = parseInt(url.searchParams.get("limit") ?? "2000", 10);

    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        kind,
        person_id,
        company_id,
        status,
        persons (document_type, document_number, first_name, last_name, email, phone),
        companies (ruc, legal_name, trade_name, email, phone)
      `)
      .limit(limit);

    if (error) throw error;

    return new Response(JSON.stringify(data ?? []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: { code: 500, message: "Error al consultar clientes en Supabase." } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
