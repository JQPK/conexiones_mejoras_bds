import type { APIRoute } from "astro";
import { getSupabaseOltp } from "@/lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const username = String(body.username ?? "").trim().toLocaleLowerCase("es");
    if (!username) {
      return new Response(
        JSON.stringify({ error: { code: 400, message: "El nombre de usuario es obligatorio." } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseOltp();
    const { data, error } = await supabase
      .from("users")
      .select("id, username, display_name, role, employee_id, email, status, created_at, updated_at")
      .ilike("username", username)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: { code: 404, message: "La cuenta no existe o está desactivada." } }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
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

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Auth validate internal error:", err);
    return new Response(
      JSON.stringify({
        error: {
          code: 500,
          message: err instanceof Error ? err.message : "Servicio no disponible, intenta más tarde.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
