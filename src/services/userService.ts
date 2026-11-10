import type { User, UserRole } from "@/domain/models";
import { assertPermission } from "@/domain/permissions";
import { validateUser, type UserInput } from "@/domain/validation";

export class UserService {
  async list(actorRole: UserRole): Promise<User[]> {
    assertPermission(actorRole, "users:manage");
    const res = await fetch("/api/users?status=all");
    if (!res.ok) throw new Error("Error al consultar usuarios en Supabase.");
    return res.json() as Promise<User[]>;
  }

  async get(actorRole: UserRole, id: string): Promise<User> {
    assertPermission(actorRole, "users:manage");
    const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("No se encontró el usuario.");
    return res.json() as Promise<User>;
  }

  async save(actorRole: UserRole, input: UserInput & { id?: string; employeeId?: string }): Promise<User> {
    assertPermission(actorRole, "users:manage");
    const errors = validateUser(input);
    if (Object.keys(errors).length) throw new Error(Object.values(errors).filter(Boolean).join(" "));

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(err?.error?.message ?? "Error al guardar usuario.");
    }
    return res.json() as Promise<User>;
  }

  async deactivate(actorRole: UserRole, id: string, currentUserId: string): Promise<void> {
    assertPermission(actorRole, "users:manage");
    if (id === currentUserId) throw new Error("No puedes desactivar tu propia cuenta mientras tienes sesión iniciada.");
    const user = await this.get(actorRole, id);
    if (user.status === "inactive") throw new Error("La cuenta ya está desactivada.");
    // Guardar con status inactivo
    await this.save(actorRole, {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      email: user.email,
      employeeId: user.employeeId,
    });
  }

  async search(actorRole: UserRole, query: string, status: "all" | "active" | "inactive" = "all"): Promise<User[]> {
    const users = await this.list(actorRole);
    const term = query.trim().toLocaleLowerCase("es");
    return users.filter(user => (status === "all" || user.status === status) &&
      (!term || [user.id, user.username, user.displayName, user.email ?? "", user.role].some(value => value.toLocaleLowerCase("es").includes(term))));
  }
}

export const userService = new UserService();
