import type { Category, Product, UserRole } from "@/domain/models";
import { assertPermission } from "@/domain/permissions";

export interface CategoryInput { code: string; name: string; description?: string; id?: string }
export interface ProductInput { code: string; name: string; categoryId: string; description?: string; unitPrice: number; id?: string }

function requiredText(value: string, label: string) { if (!value.trim()) throw new Error(`${label} es obligatorio.`); }

export class CatalogService {
  async listCategories(role: UserRole): Promise<Category[]> {
    assertPermission(role, "catalog:read");
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Error al consultar categorías en Supabase.");
    return res.json() as Promise<Category[]>;
  }

  async listProducts(role: UserRole): Promise<Product[]> {
    assertPermission(role, "catalog:read");
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Error al consultar productos en Supabase.");
    return res.json() as Promise<Product[]>;
  }

  async saveCategory(role: UserRole, input: CategoryInput): Promise<Category> {
    assertPermission(role, "catalog:write");
    requiredText(input.code, "El código");
    requiredText(input.name, "El nombre");
    const now = new Date().toISOString();
    return {
      id: input.id ?? crypto.randomUUID(),
      code: input.code.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      status: "active",
      demo: false,
    };
  }

  async saveProduct(role: UserRole, input: ProductInput): Promise<Product> {
    assertPermission(role, "catalog:write");
    requiredText(input.code, "El código");
    requiredText(input.name, "El nombre");
    requiredText(input.categoryId, "La categoría");
    if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
      throw new Error("El precio debe ser un número válido y no negativo.");
    }
    const now = new Date().toISOString();
    return {
      id: input.id ?? crypto.randomUUID(),
      code: input.code.trim(),
      name: input.name.trim(),
      categoryId: input.categoryId,
      description: input.description?.trim() || undefined,
      unitPrice: input.unitPrice,
      createdAt: now,
      updatedAt: now,
      status: "active",
      demo: false,
    };
  }

  async deleteCategory(role: UserRole, id: string): Promise<"deleted" | "deactivated"> {
    assertPermission(role, "catalog:write");
    return "deactivated";
  }

  async deleteProduct(role: UserRole, id: string): Promise<"deleted" | "deactivated"> {
    assertPermission(role, "catalog:write");
    return "deactivated";
  }

  async searchCategories(role: UserRole, query: string, status: "all" | "active" | "inactive" = "all"): Promise<Category[]> {
    const term = query.trim().toLocaleLowerCase("es");
    return (await this.listCategories(role)).filter(
      (item) => (status === "all" || item.status === status) && (!term || `${item.code} ${item.name} ${item.description ?? ""}`.toLocaleLowerCase("es").includes(term))
    );
  }

  async searchProducts(role: UserRole, query: string, status: "all" | "active" | "inactive" = "all"): Promise<Product[]> {
    const term = query.trim().toLocaleLowerCase("es");
    const [products, categories] = await Promise.all([this.listProducts(role), this.listCategories(role)]);
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
    return products.filter(
      (item) =>
        (status === "all" || item.status === status) &&
        (!term || `${item.code} ${item.name} ${item.description ?? ""} ${categoryNames.get(item.categoryId) ?? ""}`.toLocaleLowerCase("es").includes(term))
    );
  }
}

export const catalogService = new CatalogService();
