import "server-only";

import type { Database } from "@/lib/server/db/client";

export type TenantOnboardingInput = {
  name: string;
  legalName?: string | null;
  registrationNumber?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  contactPhone?: string | null;
  commodityFocus?: string | null;
};

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  province: string | null;
  verificationStatus: string;
};

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  province: string | null;
  verification_status: string;
};

export class TenantRepository {
  constructor(private readonly db: Database) {}

  async createOrUpdatePending(input: TenantOnboardingInput) {
    const slug = this.slugify(input.name);
    const result = await this.db.query<{ id: string }>(
      `
      insert into tenants (
        name,
        slug,
        legal_name,
        registration_number,
        address,
        city,
        province,
        contact_phone,
        commodity_focus
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (slug) do update
      set
        legal_name = coalesce(excluded.legal_name, tenants.legal_name),
        registration_number = coalesce(excluded.registration_number, tenants.registration_number),
        address = coalesce(excluded.address, tenants.address),
        city = coalesce(excluded.city, tenants.city),
        province = coalesce(excluded.province, tenants.province),
        contact_phone = coalesce(excluded.contact_phone, tenants.contact_phone),
        commodity_focus = coalesce(excluded.commodity_focus, tenants.commodity_focus),
        updated_at = now()
      returning id
      `,
      [
        input.name,
        slug,
        input.legalName ?? null,
        input.registrationNumber ?? null,
        input.address ?? null,
        input.city ?? null,
        input.province ?? null,
        input.contactPhone ?? null,
        input.commodityFocus ?? null,
      ],
    );

    return result.rows[0].id;
  }

  async searchByName(query: string, limit = 6): Promise<TenantSummary[]> {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return [];
    }

    const result = await this.db.query<TenantRow>(
      `
      select id, name, slug, city, province, verification_status
      from tenants
      where name ilike $1
      order by
        case when lower(name) = lower($2) then 0 else 1 end,
        name asc
      limit $3
      `,
      [`%${trimmedQuery}%`, trimmedQuery, limit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      city: row.city,
      province: row.province,
      verificationStatus: row.verification_status,
    }));
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
