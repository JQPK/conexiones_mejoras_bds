import type { APIRoute } from "astro";
import { getSupabaseOltp, isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

function mapProduct(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    categoryId: String(row.category_id ?? ""),
    description: row.description ? String(row.description) : undefined,
    unitPrice: typeof row.unit_price === "number" ? row.unit_price : Number(row.unit_price ?? 0),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    demo: false,
  };
}

export const GET: APIRoute = async ({ url }) => {
  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: { code: 503, message: "Servicio no disponible, intenta más tarde." } }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = getSupabaseOltp();
    const categoryId = url.searchParams.get("categoryId");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5000;

    let query = supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true })
      .limit(limit);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify((data ?? []).map((r) => mapProduct(r as Record<string, unknown>))), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: { code: 500, message: "Error al consultar productos en Supabase." } }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
