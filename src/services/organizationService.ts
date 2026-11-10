import type { Branch, Seller, UserRole } from "@/domain/models";
import { assertPermission } from "@/domain/permissions";
import { validateBranch, validateSeller, type BranchInput, type SellerInput } from "@/domain/validation";

type StatusFilter = "all" | "active" | "inactive";

function throwValidation(errors: Record<string, string | undefined>) {
  const messages = Object.values(errors).filter((value): value is string => !!value);
  if (messages.length) throw new Error(messages.join(" "));
}

export class OrganizationService {
  async listBranches(role: UserRole): Promise<Branch[]> {
    assertPermission(role, "organization:read");
    const res = await fetch("/api/branches");
    if (!res.ok) throw new Error("Error al consultar sucursales en Supabase.");
    return res.json() as Promise<Branch[]>;
  }

  async getBranch(role: UserRole, id: string): Promise<Branch> {
    const branches = await this.listBranches(role);
    const branch = branches.find((b) => b.id === id);
    if (!branch) throw new Error("No se encontró la sucursal.");
    return branch;
  }

  async saveBranch(role: UserRole, input: BranchInput & { id?: string }): Promise<Branch> {
    assertPermission(role, "organization:write");
    throwValidation(validateBranch(input));
    const now = new Date().toISOString();
    return {
      id: input.id ?? crypto.randomUUID(),
      code: input.code.trim().toLocaleUpperCase("es"),
      name: input.name.trim(),
      address: input.address?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      status: "active",
      demo: false,
    };
  }

  async deleteBranch(role: UserRole, id: string): Promise<"deleted" | "deactivated"> {
    assertPermission(role, "organization:write");
    return "deactivated";
  }

  async searchBranches(role: UserRole, query: string, status: StatusFilter = "all"): Promise<Branch[]> {
    const term = query.trim().toLocaleLowerCase("es");
    return (await this.listBranches(role)).filter(
      (branch) =>
        (status === "all" || branch.status === status) &&
        (!term || `${branch.code} ${branch.name} ${branch.address ?? ""} ${branch.phone ?? ""}`.toLocaleLowerCase("es").includes(term))
    );
  }

  async listSellers(role: UserRole): Promise<Seller[]> {
    assertPermission(role, "organization:read");
    const res = await fetch("/api/sellers");
    if (!res.ok) throw new Error("Error al consultar vendedores en Supabase.");
    return res.json() as Promise<Seller[]>;
  }

  async getSeller(role: UserRole, id: string): Promise<Seller> {
    const sellers = await this.listSellers(role);
    const seller = sellers.find((s) => s.id === id);
    if (!seller) throw new Error("No se encontró el vendedor.");
    return seller;
  }

  async saveSeller(role: UserRole, input: SellerInput & { id?: string }): Promise<Seller> {
    assertPermission(role, "organization:write");
    throwValidation(validateSeller(input));
    const now = new Date().toISOString();
    return {
      id: input.id ?? crypto.randomUUID(),
      name: input.name.trim(),
      documentType: input.documentType,
      documentNumber: input.documentNumber.trim(),
      branchId: input.branchId,
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      userId: input.userId?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      status: "active",
      demo: false,
    };
  }

  async deleteSeller(role: UserRole, id: string): Promise<"deleted" | "deactivated"> {
    assertPermission(role, "organization:write");
    return "deactivated";
  }

  async searchSellers(role: UserRole, query: string, status: StatusFilter = "all"): Promise<Seller[]> {
    const term = query.trim().toLocaleLowerCase("es");
    return (await this.listSellers(role)).filter(
      (seller) =>
        (status === "all" || seller.status === status) &&
        (!term || `${seller.documentNumber} ${seller.name} ${seller.email ?? ""} ${seller.phone ?? ""}`.toLocaleLowerCase("es").includes(term))
    );
  }
}

export const organizationService = new OrganizationService();
