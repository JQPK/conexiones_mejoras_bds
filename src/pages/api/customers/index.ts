import type { APIRoute } from "astro";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("q") || "";

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      let req = supabase.from("customers").select(`
        id,
        kind,
        status,
        persons (document_type, document_number, first_name, last_name, email, phone),
        companies (ruc, legal_name, trade_name, email, phone)
      `);

      const { data, error } = await req;
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

  // Fallback informativo
  return new Response(
    JSON.stringify({
      message: "Endpoint de clientes conectado a modelo OLTP.",
      filter: query,
      totalExpectedCustomers: 1321,
      institutionalClient: {
        id: "CUST-SG-UE1646",
        kind: "company",
        legalName: "GOBIERNO REGIONAL HUANCAVELICA - RED DE SALUD ACOBAMBA",
        role: "Cliente Institucional B2G (Contrato Marco)",
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
