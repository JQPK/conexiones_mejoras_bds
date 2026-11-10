import type { APIRoute } from "astro";
import { getSupabaseOltp, isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

function mapBranch(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
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
      .from("branches")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return new Response(JSON.stringify((data ?? []).map((r) => mapBranch(r as Record<string, unknown>))), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: { code: 500, message: "Error al consultar sucursales en Supabase." } }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
