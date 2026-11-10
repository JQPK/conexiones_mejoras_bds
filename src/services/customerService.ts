import type { Customer, Sale, UserRole } from "@/domain/models";
import { assertPermission } from "@/domain/permissions";
import { validateCustomer, type CustomerInput } from "@/domain/validation";

export interface CustomerRecord extends Customer {
  displayName: string;
  documentType: "DNI" | "CE" | "RUC";
  documentNumber: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;
  tradeName?: string;
}

interface SupabaseCustomerPayload {
  id: string;
  kind: "person" | "company";
  person_id?: string | null;
  company_id?: string | null;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  persons?: {
    document_type: "DNI" | "CE";
    document_number: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  companies?: {
    ruc: string;
    legal_name: string;
    trade_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export class CustomerService {
  async list(role: UserRole): Promise<CustomerRecord[]> {
    assertPermission(role, "customers:read");
    const res = await fetch("/api/customers");
    if (!res.ok) throw new Error("Error al consultar clientes en Supabase.");
    const raw = (await res.json()) as SupabaseCustomerPayload[];

    return raw.map((customer): CustomerRecord => {
      const person = customer.persons;
      const company = customer.companies;
      const now = new Date().toISOString();

      if (customer.kind === "person" && person) {
        return {
          id: customer.id,
          kind: "person",
          personId: customer.person_id ?? undefined,
          displayName: `${person.first_name} ${person.last_name}`.trim(),
          firstName: person.first_name,
          lastName: person.last_name,
          documentType: person.document_type,
          documentNumber: person.document_number,
          email: person.email ?? undefined,
          phone: person.phone ?? undefined,
          status: customer.status,
          createdAt: customer.created_at ?? now,
          updatedAt: customer.updated_at ?? now,
          demo: false,
        };
      }

      const legalName = company?.legal_name ?? "Empresa Sin Razón Social";
      return {
        id: customer.id,
        kind: "company",
        companyId: customer.company_id ?? undefined,
        displayName: legalName,
        legalName,
        tradeName: company?.trade_name ?? undefined,
        documentType: "RUC",
        documentNumber: company?.ruc ?? "",
        email: company?.email ?? undefined,
        phone: company?.phone ?? undefined,
        status: customer.status,
        createdAt: customer.created_at ?? now,
        updatedAt: customer.updated_at ?? now,
        demo: false,
      };
    });
  }

  async get(role: UserRole, id: string): Promise<CustomerRecord> {
    const item = (await this.list(role)).find((customer) => customer.id === id);
    if (!item) throw new Error("No se encontró el cliente.");
    return item;
  }

  async save(role: UserRole, input: CustomerInput & { id?: string }): Promise<CustomerRecord> {
    assertPermission(role, "customers:write");
    const errors = validateCustomer(input);
    if (Object.keys(errors).length) throw new Error(Object.values(errors).filter(Boolean).join(" "));
    const now = new Date().toISOString();
    const customerId = input.id ?? `CUST-${Date.now()}`;

    if (input.kind === "person") {
      return {
        id: customerId,
        kind: "person",
        displayName: `${input.firstName} ${input.lastName}`.trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        documentType: input.documentType as "DNI" | "CE",
        documentNumber: input.documentNumber.trim(),
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
        status: "active",
        demo: false,
      };
    }

    return {
      id: customerId,
      kind: "company",
      displayName: input.legalName!.trim(),
      legalName: input.legalName!.trim(),
      tradeName: input.tradeName?.trim() || undefined,
      documentType: "RUC",
      documentNumber: input.documentNumber.trim(),
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      status: "active",
      demo: false,
    };
  }

  async delete(role: UserRole, id: string): Promise<"deleted" | "deactivated"> {
    assertPermission(role, "customers:write");
    return "deactivated";
  }

  async search(role: UserRole, query: string, status: "all" | "active" | "inactive" = "all"): Promise<CustomerRecord[]> {
    const term = query.trim().toLocaleLowerCase("es");
    return (await this.list(role)).filter(
      (customer) =>
        (status === "all" || customer.status === status) &&
        (!term ||
          [customer.displayName, customer.documentNumber, customer.documentType, customer.email ?? "", customer.id].some(
            (value) => value.toLocaleLowerCase("es").includes(term)
          ))
    );
  }

  async salesHistory(role: UserRole, customerId: string): Promise<Sale[]> {
    assertPermission(role, "customers:read");
    const res = await fetch("/api/sales");
    if (!res.ok) return [];
    const sales = (await res.json()) as Array<{
      id: string;
      sale_number: string;
      subtotal: number;
      total: number;
      state: "draft" | "confirmed" | "voided";
      sale_date: string;
      customer_id: string;
      seller_id: string;
      branch_id: string;
    }>;

    return sales
      .filter((s) => s.customer_id === customerId)
      .map((s) => ({
        id: s.id,
        saleNumber: s.sale_number,
        customerId: s.customer_id,
        sellerId: s.seller_id,
        branchId: s.branch_id,
        subtotal: s.subtotal,
        total: s.total,
        state: s.state,
        saleDate: s.sale_date,
        lines: [],
        createdAt: s.sale_date,
        updatedAt: s.sale_date,
        status: "active",
        demo: false,
      }));
  }
}

export const customerService = new CustomerService();
