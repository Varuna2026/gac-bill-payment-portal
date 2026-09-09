-- P2V2 database architecture for Supabase PostgreSQL
create extension if not exists pgcrypto;

create table if not exists user_role_master (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  role text not null check (role in ('VENDOR','WH','GAC_COMPLIANCE','GAC_PO','ACCOUNTS','CBO_OFFICE','CBO_OFFICER','ADMIN')),
  vendor_id uuid,
  wh_scope text,
  created_at timestamptz not null default now()
);

create table if not exists master_data (
  id uuid primary key default gen_random_uuid(),
  head text not null check (head in ('COMPANY','PROJECT_LOCATION','VENDOR','CONTRACT_TYPE','SERVICE_TYPE','SUB_CATEGORY')),
  value text not null,
  company text,
  project_location text,
  vendor_name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists invoice_records (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  project_location text not null,
  vendor text not null,
  contract_type text not null check (contract_type in ('Commercial','Minimum Wages','Others')),
  service_type text not null,
  sub_category text,
  inv_no text not null,
  taxable_amt numeric(18,2) not null,
  amt_incl_gst numeric(18,2) not null,
  current_status text not null default 'DRAFT',
  current_stage text not null,
  current_responsible_user uuid,
  created_at timestamptz not null default now(),
  latest_remarks text
);

create table if not exists document_records (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoice_records(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  version_no integer not null default 1
);

create table if not exists workflow_history (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoice_records(id) on delete cascade,
  from_stage text,
  to_stage text,
  action text not null,
  actor_user uuid,
  remarks text,
  action_at timestamptz not null default now(),
  user_tat_seconds bigint default 0,
  cumulative_tat_seconds bigint default 0,
  sunday_count integer default 0,
  nh_count integer default 0
);

create table if not exists pr_po_utr (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid unique not null references invoice_records(id) on delete cascade,
  pr_number text,
  pr_mapped_by uuid,
  pr_mapped_at timestamptz,
  po_number text,
  po_mapped_by uuid,
  po_mapped_at timestamptz,
  utr_number text,
  utr_mapped_by uuid,
  utr_mapped_at timestamptz
);

create table if not exists tat_calculation_structure (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoice_records(id) on delete cascade,
  stage text not null,
  responsible_user uuid,
  start_at timestamptz not null,
  end_at timestamptz,
  tat_seconds bigint default 0,
  sunday_count integer default 0,
  nh_count integer default 0
);

create index if not exists idx_invoice_status on invoice_records(current_status);
create index if not exists idx_invoice_stage on invoice_records(current_stage);
create index if not exists idx_invoice_company on invoice_records(company);
create index if not exists idx_invoice_inv_no on invoice_records(inv_no);
create index if not exists idx_history_invoice on workflow_history(invoice_id, action_at);
create index if not exists idx_documents_invoice on document_records(invoice_id);

-- Storage bucket to be created from Supabase Storage UI/API: invoice-documents.
-- Keep files in Supabase Storage; GitHub stores source code only.
