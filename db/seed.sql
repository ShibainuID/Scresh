-- Demo password for all seeded users: Password123
-- This seed supports three storylines:
-- 1. Petugas koperasi: batch masuk -> cold storage -> distribusi keluar, waste turun.
-- 2. Petugas kredit: credit risk assessment from member profile, history,
--    and consent-based safe data sharing.
-- 3. Auditor/supervisor: loan data change inspection with audit trail,
--    version history, and masked access.

with seeded_tenants as (
  insert into tenants (
    name,
    slug,
    legal_name,
    registration_number,
    address,
    city,
    province,
    contact_phone,
    commodity_focus,
    verification_status
  )
  values
    (
      'Koperasi Melati Jaya',
      'koperasi-melati-jaya',
      'Koperasi Produsen Melati Jaya Sejahtera',
      'BH-3273-2024-001',
      'Jl. Pasar Induk No. 12',
      'Bandung',
      'Jawa Barat',
      '081234567890',
      'Cabai, tomat, sayur daun',
      'verified'
    ),
    (
      'Koperasi Sayur Segar Lembang',
      'koperasi-sayur-segar-lembang',
      'Koperasi Sayur Segar Lembang',
      'BH-3204-2024-014',
      'Jl. Raya Lembang No. 88',
      'Bandung Barat',
      'Jawa Barat',
      '081298765432',
      'Selada, timun, kol',
      'verified'
    )
  on conflict (slug) do update
  set
    legal_name = excluded.legal_name,
    registration_number = excluded.registration_number,
    address = excluded.address,
    city = excluded.city,
    province = excluded.province,
    contact_phone = excluded.contact_phone,
    commodity_focus = excluded.commodity_focus,
    verification_status = excluded.verification_status,
    updated_at = now()
  returning id, slug
),
seeded_modules as (
  insert into modules (code, name, description)
  values
    ('central-core', 'Centralized Core', 'Tenant, RBAC, members, loans, approvals, audit trail.'),
    ('scresh', 'Scresh', 'Batch, freshness scan, cold storage, FIFO distribution, movement.')
  on conflict (code) do update
  set name = excluded.name, description = excluded.description
  returning id, code
)
insert into tenant_modules (tenant_id, module_id, status)
select t.id, m.id, 'active'
from tenants t
join modules m on m.code in ('central-core', 'scresh')
where t.slug in ('koperasi-melati-jaya', 'koperasi-sayur-segar-lembang')
on conflict (tenant_id, module_id) do update
set status = excluded.status;

insert into users (tenant_id, name, email, password_hash, is_active)
select t.id, user_seed.name, user_seed.email, user_seed.password_hash, true
from tenants t
join (
  values
    ('koperasi-melati-jaya', 'Siti Rahma', 'siti.melati@koperasi.id', '$2b$12$e46NpGbVjpmmJ4EnovXS1eTMHEbfLbl00nu4olHPyPbYyRUr/nilq'),
    ('koperasi-melati-jaya', 'Rani Prameswari', 'rani.melati@koperasi.id', '$2b$12$e46NpGbVjpmmJ4EnovXS1eTMHEbfLbl00nu4olHPyPbYyRUr/nilq'),
    ('koperasi-melati-jaya', 'Budi Santoso', 'budi.melati@koperasi.id', '$2b$12$e46NpGbVjpmmJ4EnovXS1eTMHEbfLbl00nu4olHPyPbYyRUr/nilq'),
    ('koperasi-melati-jaya', 'Dina Audit Dinas', 'dina.supervisor@koperasi.id', '$2b$12$e46NpGbVjpmmJ4EnovXS1eTMHEbfLbl00nu4olHPyPbYyRUr/nilq'),
    ('koperasi-melati-jaya', 'Admin Platform', 'admin.melati@koperasi.id', '$2b$12$e46NpGbVjpmmJ4EnovXS1eTMHEbfLbl00nu4olHPyPbYyRUr/nilq'),
    ('koperasi-sayur-segar-lembang', 'Petugas Lembang', 'petugas.lembang@koperasi.id', '$2b$12$e46NpGbVjpmmJ4EnovXS1eTMHEbfLbl00nu4olHPyPbYyRUr/nilq')
) as user_seed(tenant_slug, name, email, password_hash)
  on user_seed.tenant_slug = t.slug
on conflict (email) do update
set tenant_id = excluded.tenant_id, name = excluded.name, password_hash = excluded.password_hash, is_active = true;

insert into user_roles (user_id, role)
select u.id, role_seed.role::app_role
from users u
join (
  values
    ('siti.melati@koperasi.id', 'staff'),
    ('rani.melati@koperasi.id', 'credit'),
    ('budi.melati@koperasi.id', 'manager'),
    ('dina.supervisor@koperasi.id', 'supervisor'),
    ('admin.melati@koperasi.id', 'admin'),
    ('petugas.lembang@koperasi.id', 'staff')
) as role_seed(email, role)
  on role_seed.email = u.email
on conflict (user_id, role) do nothing;

insert into members (tenant_id, full_name, national_id, phone, commodity_focus, membership_status)
select t.id, member_seed.full_name, member_seed.national_id, member_seed.phone, member_seed.commodity_focus, 'active'
from tenants t
join (
  values
    ('koperasi-melati-jaya', 'Pak Maman Supplier Cabai', '3273010101800001', '081111111111', 'Cabai merah'),
    ('koperasi-melati-jaya', 'Bu Rina Supplier Tomat', '3273014102850002', '082222222222', 'Tomat'),
    ('koperasi-sayur-segar-lembang', 'Pak Asep Supplier Selada', '3204011201780003', '083333333333', 'Selada')
) as member_seed(tenant_slug, full_name, national_id, phone, commodity_focus)
  on member_seed.tenant_slug = t.slug
where not exists (
  select 1 from members m where m.tenant_id = t.id and m.national_id = member_seed.national_id
);

insert into loans (
  tenant_id,
  member_id,
  requested_by_user_id,
  approved_by_user_id,
  loan_number,
  principal_amount,
  purpose,
  risk_tier,
  status,
  approved_at
)
select
  t.id,
  m.id,
  credit.id,
  manager.id,
  loan_seed.loan_number,
  loan_seed.principal_amount,
  loan_seed.purpose,
  loan_seed.risk_tier,
  loan_seed.status,
  loan_seed.approved_at::timestamptz
from tenants t
join members m on m.tenant_id = t.id
join users credit on credit.email = 'rani.melati@koperasi.id'
join users manager on manager.email = 'budi.melati@koperasi.id'
join (
  values
    ('koperasi-melati-jaya', 'Pak Maman Supplier Cabai', 'L-KMJ-202606-001', 15000000.00, 'Modal kerja pembelian cabai dari petani anggota', 'medium', 'approved', '2026-06-12 09:10:00+07'),
    ('koperasi-melati-jaya', 'Bu Rina Supplier Tomat', 'L-KMJ-202606-002', 5000000.00, 'Dana transport distribusi tomat ke offtaker', 'low', 'pending_review', null)
) as loan_seed(tenant_slug, member_name, loan_number, principal_amount, purpose, risk_tier, status, approved_at)
  on loan_seed.tenant_slug = t.slug and loan_seed.member_name = m.full_name
on conflict (loan_number) do update
set
  principal_amount = excluded.principal_amount,
  purpose = excluded.purpose,
  risk_tier = excluded.risk_tier,
  status = excluded.status,
  approved_by_user_id = excluded.approved_by_user_id,
  approved_at = excluded.approved_at,
  updated_at = now();

insert into loan_versions (loan_id, version_number, principal_amount, change_reason, changed_by_user_id, created_at)
select l.id, version_seed.version_number, version_seed.principal_amount, version_seed.change_reason, u.id, version_seed.created_at::timestamptz
from loans l
join (
  values
    ('L-KMJ-202606-001', 1, 5000000.00, 'Pengajuan awal petugas kredit dari profil anggota dan credit summary', 'rani.melati@koperasi.id', '2026-06-12 08:20:00+07'),
    ('L-KMJ-202606-001', 2, 15000000.00, 'Nilai transaksi pinjaman dinaikkan setelah verifikasi stok dan kontrak offtaker', 'budi.melati@koperasi.id', '2026-06-12 09:10:00+07'),
    ('L-KMJ-202606-002', 1, 5000000.00, 'Pengajuan awal transport distribusi dari assessment petugas kredit', 'rani.melati@koperasi.id', '2026-06-12 10:00:00+07')
) as version_seed(loan_number, version_number, principal_amount, change_reason, email, created_at)
  on version_seed.loan_number = l.loan_number
join users u on u.email = version_seed.email
on conflict (loan_id, version_number) do update
set principal_amount = excluded.principal_amount, change_reason = excluded.change_reason, changed_by_user_id = excluded.changed_by_user_id;

insert into loan_change_requests (
  loan_id,
  requested_by_user_id,
  reviewed_by_user_id,
  field_name,
  old_value,
  new_value,
  reason,
  status,
  reviewed_at,
  created_at
)
select
  l.id,
  credit.id,
  manager.id,
  'principal_amount',
  '5000000',
  '15000000',
  'Petugas kredit meminta perubahan nilai transaksi pinjaman setelah credit summary dan kebutuhan anggota diverifikasi.',
  'approved',
  '2026-06-12 09:08:00+07'::timestamptz,
  '2026-06-12 08:55:00+07'::timestamptz
from loans l
join users credit on credit.email = 'rani.melati@koperasi.id'
join users manager on manager.email = 'budi.melati@koperasi.id'
where l.loan_number = 'L-KMJ-202606-001'
  and not exists (
    select 1 from loan_change_requests lcr
    where lcr.loan_id = l.id and lcr.field_name = 'principal_amount' and lcr.new_value = '15000000'
  );

insert into loans (
  tenant_id,
  member_id,
  requested_by_user_id,
  approved_by_user_id,
  loan_number,
  principal_amount,
  purpose,
  risk_tier,
  status,
  approved_at
)
select
  t.id,
  m.id,
  credit.id,
  case when series.n % 5 = 0 then null else manager.id end,
  'L-KMJ-202606-D' || lpad(series.n::text, 3, '0'),
  (6000000 + (series.n * 250000))::numeric(14, 2),
  case series.n % 4
    when 0 then 'Modal kerja pembelian sayur anggota'
    when 1 then 'Dana distribusi hasil panen'
    when 2 then 'Pembelian kemasan dan cold-storage'
    else 'Pembiayaan operasional koperasi'
  end,
  case
    when series.n % 9 = 0 then 'high'
    when series.n % 5 = 0 then 'medium'
    else 'low'
  end,
  case
    when series.n <= 5 then 'pending_review'
    when series.n % 5 = 0 then 'pending_review'
    else 'approved'
  end,
  case
    when series.n <= 5 or series.n % 5 = 0 then null
    else '2026-06-12 13:00:00+07'::timestamptz + (series.n || ' minutes')::interval
  end
from generate_series(1, 64) as series(n)
join tenants t on t.slug = 'koperasi-melati-jaya'
join lateral (
  select m.id
  from members m
  where m.tenant_id = t.id
  order by m.full_name
  offset ((series.n - 1) % 3)
  limit 1
) m on true
join users credit on credit.email = 'rani.melati@koperasi.id'
join users manager on manager.email = 'budi.melati@koperasi.id'
on conflict (loan_number) do update
set
  member_id = excluded.member_id,
  requested_by_user_id = excluded.requested_by_user_id,
  approved_by_user_id = excluded.approved_by_user_id,
  principal_amount = excluded.principal_amount,
  purpose = excluded.purpose,
  risk_tier = excluded.risk_tier,
  status = excluded.status,
  approved_at = excluded.approved_at,
  updated_at = now();

insert into scresh_batches (
  tenant_id,
  registered_by_user_id,
  batch_code,
  commodity,
  supplier_name,
  claimed_weight_kg,
  actual_weight_kg,
  remaining_weight_kg,
  buy_price_per_kg,
  freshness_grade,
  confidence_score,
  shelf_life_hours,
  storage_location,
  distribution_priority,
  status,
  created_at
)
select
  t.id,
  staff.id,
  batch_seed.batch_code,
  batch_seed.commodity,
  batch_seed.supplier_name,
  batch_seed.claimed_weight_kg,
  batch_seed.actual_weight_kg,
  batch_seed.actual_weight_kg,
  batch_seed.buy_price_per_kg,
  batch_seed.freshness_grade,
  batch_seed.confidence_score,
  batch_seed.shelf_life_hours,
  batch_seed.storage_location,
  batch_seed.distribution_priority,
  batch_seed.status,
  batch_seed.created_at::timestamptz
from tenants t
join users staff on staff.email = 'siti.melati@koperasi.id'
join (
  values
    ('koperasi-melati-jaya', 'KMJ-CBI-20260612-001', 'Cabai Merah', 'Pak Maman Supplier Cabai', 3000.00, 2920.00, 18500.00, 'A', 92.50, 120, 'Cold Room A-01', 2, 'in_storage', '2026-06-12 07:40:00+07'),
    ('koperasi-melati-jaya', 'KMJ-TMT-20260612-002', 'Tomat', 'Bu Rina Supplier Tomat', 1800.00, 1690.00, 12000.00, 'C', 87.20, 18, 'Cold Room B-03', 1, 'priority_distribution', '2026-06-12 08:15:00+07')
) as batch_seed(tenant_slug, batch_code, commodity, supplier_name, claimed_weight_kg, actual_weight_kg, buy_price_per_kg, freshness_grade, confidence_score, shelf_life_hours, storage_location, distribution_priority, status, created_at)
  on batch_seed.tenant_slug = t.slug
on conflict (batch_code) do update
set
  actual_weight_kg = excluded.actual_weight_kg,
  remaining_weight_kg = excluded.remaining_weight_kg,
  buy_price_per_kg = excluded.buy_price_per_kg,
  freshness_grade = excluded.freshness_grade,
  confidence_score = excluded.confidence_score,
  shelf_life_hours = excluded.shelf_life_hours,
  storage_location = excluded.storage_location,
  distribution_priority = excluded.distribution_priority,
  status = excluded.status;

insert into scresh_movements (batch_id, moved_by_user_id, movement_type, quantity_kg, destination, notes, created_at)
select b.id, staff.id, movement_seed.movement_type, movement_seed.quantity_kg, movement_seed.destination, movement_seed.notes, movement_seed.created_at::timestamptz
from scresh_batches b
join users staff on staff.email = 'siti.melati@koperasi.id'
join (
  values
    ('KMJ-CBI-20260612-001', 'outbound', 800.00, 'Pasar Mitra Ciroyom', 'Distribusi normal berdasarkan FIFO.', '2026-06-12 11:30:00+07'),
    ('KMJ-TMT-20260612-002', 'outbound', 1200.00, 'Offtaker Resto Bandung', 'Prioritas keluar karena Grade C dan shelf life 18 jam.', '2026-06-12 12:10:00+07')
) as movement_seed(batch_code, movement_type, quantity_kg, destination, notes, created_at)
  on movement_seed.batch_code = b.batch_code
where not exists (
  select 1 from scresh_movements sm
  where sm.batch_id = b.id and sm.destination = movement_seed.destination and sm.quantity_kg = movement_seed.quantity_kg
);

insert into audit_anomalies (tenant_id, loan_id, risk_score, reason, status, created_at)
select
  l.tenant_id,
  l.id,
  95,
  'Nilai pinjaman naik 200% dari Rp5.000.000 ke Rp15.000.000; perubahan sudah melalui approval manager.',
  'open',
  '2026-06-12 09:12:00+07'::timestamptz
from loans l
where l.loan_number = 'L-KMJ-202606-001'
  and not exists (
    select 1 from audit_anomalies aa where aa.loan_id = l.id and aa.reason like 'Nilai pinjaman naik 200%'
  );

insert into audit_logs (actor_user_id, action, resource_type, resource_id, metadata, created_at)
select actor.id, audit_seed.action, audit_seed.resource_type, audit_seed.resource_id, audit_seed.metadata::jsonb, audit_seed.created_at::timestamptz
from (
  values
    ('siti.melati@koperasi.id', 'scresh.batch.registered', 'batch', 'KMJ-CBI-20260612-001', '{"useCase":"Petugas koperasi melacak batch masuk tanpa laporan manual","claimedWeightKg":3000,"actualWeightKg":2920}'::text, '2026-06-12 07:40:00+07'),
    ('siti.melati@koperasi.id', 'scresh.movement.outbound', 'batch', 'KMJ-TMT-20260612-002', '{"useCase":"Distribusi keluar prioritas untuk menurunkan waste","destination":"Offtaker Resto Bandung","quantityKg":1200}'::text, '2026-06-12 12:10:00+07'),
    ('rani.melati@koperasi.id', 'loan.change_requested', 'loan', 'L-KMJ-202606-001', '{"field":"principal_amount","oldValue":"5000000","newValue":"15000000","requiresManagerApproval":true,"useCase":"Petugas kredit mengisi dan mengubah pengajuan pinjaman; manager harus approve"}'::text, '2026-06-12 08:55:00+07'),
    ('budi.melati@koperasi.id', 'loan.change_approved', 'loan', 'L-KMJ-202606-001', '{"field":"principal_amount","approvedByRole":"manager","oldValue":"5000000","newValue":"15000000"}'::text, '2026-06-12 09:08:00+07'),
    ('dina.supervisor@koperasi.id', 'audit.anomaly_viewed', 'loan', 'L-KMJ-202606-001', '{"useCase":"Auditor mendapat visibilitas perubahan pinjaman dengan audit trail dan data masking","riskScore":95}'::text, '2026-06-12 09:20:00+07')
) as audit_seed(email, action, resource_type, resource_id, metadata, created_at)
join users actor on actor.email = audit_seed.email
where not exists (
  select 1 from audit_logs al
  where al.actor_user_id = actor.id
    and al.action = audit_seed.action
    and al.resource_id = audit_seed.resource_id
    and al.created_at = audit_seed.created_at::timestamptz
);

insert into audit_logs (actor_user_id, action, resource_type, resource_id, metadata, created_at)
select
  actor.id,
  'loan.audit_dummy',
  'loan',
  'L-KMJ-202606-D' || lpad(series.n::text, 3, '0'),
  jsonb_build_object(
    'memberMasked',
    case series.n % 6
      when 0 then 'M****n'
      when 1 then 'R**a'
      when 2 then 'A***f'
      when 3 then 'N***a'
      when 4 then 'S***i'
      else 'D***n'
    end,
    'field',
    case series.n % 4
      when 0 then 'principal_amount'
      when 1 then 'risk_tier'
      when 2 then 'purpose'
      else 'approval_status'
    end,
    'oldValue',
    case series.n % 4
      when 0 then 'Rp5.000.000'
      when 1 then 'low'
      when 2 then 'Modal kerja'
      else 'pending'
    end,
    'newValue',
    case series.n % 4
      when 0 then 'Rp' || (6 + series.n) || '.000.000'
      when 1 then case when series.n % 3 = 0 then 'high' else 'medium' end
      when 2 then 'Modal kerja + distribusi'
      else case when series.n % 2 = 0 then 'approved' else 'logged' end
    end,
    'reviewer',
    case when series.n % 3 = 0 then 'Menunggu' else 'Budi Santoso' end,
    'approvalStatus',
    case
      when series.n <= 5 then 'pending'
      when series.n % 5 = 0 then 'pending'
      when series.n % 7 = 0 then 'logged'
      else 'approved'
    end,
    'riskScore',
    case
      when series.n <= 5 then 48 + series.n
      when series.n % 9 = 0 then 95
      when series.n % 5 = 0 then 78
      when series.n % 4 = 0 then 64
      else 28 + (series.n % 24)
    end,
    'reason',
    case
      when series.n <= 5 then 'Menunggu approval manager untuk perubahan normal'
      when series.n % 9 = 0 then 'Nilai pinjaman naik ekstrem sebelum pencairan'
      when series.n % 5 = 0 then 'Persetujuan belum selesai untuk perubahan sensitif'
      when series.n % 4 = 0 then 'Ringkasan kredit menunjukkan risiko menengah'
      else 'Log pemeriksaan perubahan pinjaman dengan data anggota dimasking'
    end
  ),
  '2026-06-12 14:00:00+07'::timestamptz + (series.n || ' minutes')::interval
from generate_series(1, 64) as series(n)
join users actor on actor.email = case
  when series.n % 3 = 0 then 'budi.melati@koperasi.id'
  else 'rani.melati@koperasi.id'
end
where not exists (
  select 1 from audit_logs al
  where al.action = 'loan.audit_dummy'
    and al.resource_id = 'L-KMJ-202606-D' || lpad(series.n::text, 3, '0')
);
