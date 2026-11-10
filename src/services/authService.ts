import type { User } from "@/domain/models";

const SESSION_KEY = "arimana-demo-session";
const DEMO_PASSWORD = "Demo2026!";
export const DEMO_LOGIN_PASSWORD = DEMO_PASSWORD;

interface Session { userId: string; startedAt: string }

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as Session | null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export const authService = {
  async signIn(username: string, password: string): Promise<User> {
    if (password !== DEMO_PASSWORD) {
      throw new Error("El usuario o la contraseña no son correctos.");
    }
    const normalized = username.trim().toLocaleLowerCase("es");
    const response = await fetch("/api/auth/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalized }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(data?.error?.message ?? "La cuenta no existe o está desactivada.");
    }
    const { user } = await response.json() as { user: User };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, startedAt: new Date().toISOString() } satisfies Session));
    return user;
  },

  async currentUser(): Promise<User | null> {
    const session = readSession();
    if (!session) return null;
    try {
      const response = await fetch(`/api/auth/me?userId=${encodeURIComponent(session.userId)}`);
      if (!response.ok) {
        this.signOut();
        return null;
      }
      const { user } = await response.json() as { user: User };
      if (!user || user.status !== "active") {
        this.signOut();
        return null;
      }
      return user;
    } catch {
      // Si Supabase no responde, mantener sesión local temporalmente
      return null;
    }
  },

  signOut(): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
  },
};
