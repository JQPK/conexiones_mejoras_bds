import type { APIRoute } from "astro";
import { getSupabaseOltp, isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

function mapUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    employeeId: row.employee_id ?? undefined,
    email: row.email ?? undefined,
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
    const userId = url.searchParams.get("id");
    if (userId) {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, role, employee_id, email, status, created_at, updated_at, demo")
        .eq("id", userId)
        .single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: { code: 404, message: "Usuario no encontrado." } }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify(mapUser(data as Record<string, unknown>)), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const status = url.searchParams.get("status") ?? "active";
    let query = supabase
      .from("users")
      .select("id, username, display_name, role, employee_id, email, status, created_at, updated_at, demo")
      .order("display_name", { ascending: true });
    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify((data ?? []).map((r) => mapUser(r as Record<string, unknown>))), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: { code: 500, message: "Error al consultar usuarios en Supabase." } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: { code: 503, message: "Servicio no disponible, intenta más tarde." } }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = getSupabaseOltp();
    const body = await request.json() as Record<string, unknown>;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: body.id ?? crypto.randomUUID(),
        username: String(body.username ?? "").trim(),
        display_name: String(body.displayName ?? "").trim(),
        role: body.role,
        employee_id: body.employeeId ?? null,
        email: body.email ?? null,
        status: "active",
        demo: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw error;
    return new Response(JSON.stringify(mapUser(data as Record<string, unknown>)), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: { code: 400, message: err instanceof Error ? err.message : "Error al crear usuario." } }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
};
