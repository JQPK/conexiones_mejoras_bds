import type { APIRoute } from "astro";
import { getSupabaseOltp, isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

function mapSeller(row: Record<string, unknown>) {
  return {
    id: row.id,
    documentType: (row.document_type ?? "DNI") as "DNI" | "CE",
    documentNumber: String(row.document_number ?? ""),
    name: String(row.name ?? ""),
    branchId: String(row.branch_id ?? ""),
    email: row.email ? String(row.email) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    userId: row.user_id ? String(row.user_id) : undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    demo: false,
  };
}

export const GET: APIRoute = async () => {
  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: { code: 503, message: "Servicio no disponible, intenta más tarde." } }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = getSupabaseOltp();
    const { data, error } = await supabase
      .from("sellers")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return new Response(JSON.stringify((data ?? []).map((r) => mapSeller(r as Record<string, unknown>))), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: { code: 500, message: "Error al consultar vendedores en Supabase." } }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
