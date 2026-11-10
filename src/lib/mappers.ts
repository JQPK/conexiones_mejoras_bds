/**
 * Mapeadores de filas Supabase (snake_case) a modelos TypeScript (camelCase).
 */
import type { User, Branch, Seller } from "@/domain/models";

// Tipos Supabase raw
export interface SupabaseUserRow {
  id: string;
  username: string;
  display_name: string;
  role: string;
  employee_id?: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  demo?: boolean | null;
}

export interface SupabaseBranchRow {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  demo?: boolean | null;
}

export interface SupabaseSellerRow {
  id: string;
  display_name?: string | null;
  name?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  branch_id?: string | null;
  email?: string | null;
  phone?: string | null;
  user_id?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  demo?: boolean | null;
}

export function mapUser(row: SupabaseUserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role as User["role"],
    employeeId: row.employee_id ?? undefined,
    email: row.email ?? undefined,
    status: row.status as User["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    demo: false,
  };
}

export function mapBranch(row: SupabaseBranchRow): Branch {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status as Branch["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    demo: false,
  };
}

export function mapSeller(row: SupabaseSellerRow): Seller {
  return {
    id: row.id,
    documentType: (row.document_type ?? "DNI") as Seller["documentType"],
    documentNumber: row.document_number ?? "",
    name: row.name ?? row.display_name ?? "",
    branchId: row.branch_id ?? "",
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    userId: row.user_id ?? undefined,
    status: row.status as Seller["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    demo: false,
  };
}
