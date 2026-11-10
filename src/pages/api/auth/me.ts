import type { APIRoute } from "astro";
import { getSupabaseOltp } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const userId = url.searchParams.get("userId") ?? "";
    if (!userId) {
      return new Response(JSON.stringify({ error: { code: 400, message: "userId es requerido." } }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const supabase = getSupabaseOltp();
    const { data, error } = await supabase
      .from("users")
      .select("id, username, display_name, role, employee_id, email, status, created_at, updated_at")
      .eq("id", userId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: { code: 404, message: "Sesión inválida." } }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const user = {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      role: data.role,
      employeeId: data.employee_id ?? undefined,
      email: data.email ?? undefined,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      demo: false,
    };
    return new Response(JSON.stringify({ user }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: { code: 500, message: "Servicio no disponible, intenta más tarde." } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
