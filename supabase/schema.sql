-- ============================================================
-- GAC BILL PAYMENT PORTAL — P2V2
-- CLEAN INITIAL SUPABASE DATABASE INSTALL
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. USER & ROLE MASTER
-- ============================================================

create table if not exists public.user_role_master (
    id uuid primary key default gen_random_uuid(),
    username text unique not null,
    display_name text not null,
    role text not null check (
        role in (
            'VENDOR',
            'WH',
            'GAC_COMPLIANCE',
            'GAC_PO',
            'ACCOUNTS',
            'CBO_OFFICE',
            'CBO_OFFICER',
            'ADMIN'
        )
    ),
    vendor_id uuid,
    wh_scope text,
    auth_user_id uuid,
    created_at timestamptz not null default now()
);

create unique index if not exists user_role_master_auth_user_id_uidx
    on public.user_role_master(auth_user_id)
    where auth_user_id is not null;

-- ============================================================
-- 2. MASTER DATA
-- ============================================================

create table if not exists public.master_data (
    id uuid primary key default gen_random_uuid(),
    head text not null check (
        head in (
            'COMPANY',
            'PROJECT_LOCATION',
            'VENDOR',
            'CONTRACT_TYPE',
            'SERVICE_TYPE',
            'SUB_CATEGORY'
        )
    ),
    value text not null,
    company text,
    project_location text,
    vendor_name text,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 3. INVOICE / SUBMISSION RECORD
-- ============================================================

create table if not exists public.invoice_records (
    id uuid primary key default gen_random_uuid(),
    company text not null,
    project_location text not null,
    vendor text not null,
    contract_type text not null check (
        contract_type in (
            'Commercial',
            'Minimum Wages',
            'Others'
        )
    ),
    service_type text not null,
    sub_category text,
    inv_no text not null,
    taxable_amt numeric(18,2) not null,
    amt_incl_gst numeric(18,2) not null,
    current_status text not null default 'DRAFT',
    current_stage text not null,
    current_responsible_user uuid,
    created_at timestamptz not null default now(),
    latest_remarks text,
    last_action_at timestamptz
);

-- ============================================================
-- 4. DOCUMENT RECORDS
-- ============================================================

create table if not exists public.document_records (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoice_records(id) on delete cascade,
    document_type text not null,
    file_name text not null,
    storage_path text not null,
    uploaded_by uuid,
    uploaded_at timestamptz not null default now(),
    version_no integer not null default 1,
    is_current boolean not null default true
);

-- ============================================================
-- 5. WORKFLOW HISTORY
-- ============================================================

create table if not exists public.workflow_history (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoice_records(id) on delete cascade,
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

-- ============================================================
-- 6. PR / PO / UTR
-- ============================================================

create table if not exists public.pr_po_utr (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid unique not null references public.invoice_records(id) on delete cascade,
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

-- ============================================================
-- 7. TAT CALCULATION
-- ============================================================

create table if not exists public.tat_calculation_structure (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoice_records(id) on delete cascade,
    stage text not null,
    responsible_user uuid,
    start_at timestamptz not null,
    end_at timestamptz,
    tat_seconds bigint default 0,
    sunday_count integer default 0,
    nh_count integer default 0
);

-- ============================================================
-- 8. INDEXES
-- ============================================================

create index if not exists idx_invoice_status on public.invoice_records(current_status);
create index if not exists idx_invoice_stage on public.invoice_records(current_stage);
create index if not exists idx_invoice_company on public.invoice_records(company);
create index if not exists idx_invoice_project_location on public.invoice_records(project_location);
create index if not exists idx_invoice_vendor on public.invoice_records(vendor);
create index if not exists idx_invoice_inv_no on public.invoice_records(inv_no);
create index if not exists idx_invoice_contract_type on public.invoice_records(contract_type);
create index if not exists idx_invoice_service_type on public.invoice_records(service_type);
create index if not exists idx_history_invoice on public.workflow_history(invoice_id, action_at);
create index if not exists idx_documents_invoice on public.document_records(invoice_id);
create index if not exists idx_documents_current on public.document_records(invoice_id, is_current);
create index if not exists idx_tat_invoice on public.tat_calculation_structure(invoice_id);
create index if not exists idx_master_head on public.master_data(head);
create index if not exists idx_master_active on public.master_data(active);

-- ============================================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.user_role_master enable row level security;
alter table public.master_data enable row level security;
alter table public.invoice_records enable row level security;
alter table public.document_records enable row level security;
alter table public.workflow_history enable row level security;
alter table public.pr_po_utr enable row level security;
alter table public.tat_calculation_structure enable row level security;

-- ============================================================
-- 10. INITIAL AUTHENTICATED-USER POLICIES
-- ============================================================

create policy if not exists "P2V2 authenticated users read user roles"
on public.user_role_master for select to authenticated using (true);

create policy if not exists "P2V2 authenticated users read master data"
on public.master_data for select to authenticated using (true);

create policy if not exists "P2V2 authenticated users read invoices"
on public.invoice_records for select to authenticated using (true);

create policy if not exists "P2V2 authenticated users insert invoices"
on public.invoice_records for insert to authenticated with check (true);

create policy if not exists "P2V2 authenticated users update invoices"
on public.invoice_records for update to authenticated using (true) with check (true);

create policy if not exists "P2V2 authenticated users read documents"
on public.document_records for select to authenticated using (true);

create policy if not exists "P2V2 authenticated users insert documents"
on public.document_records for insert to authenticated with check (true);

create policy if not exists "P2V2 authenticated users read workflow history"
on public.workflow_history for select to authenticated using (true);

create policy if not exists "P2V2 authenticated users insert workflow history"
on public.workflow_history for insert to authenticated with check (true);

create policy if not exists "P2V2 authenticated users read PR PO UTR"
on public.pr_po_utr for select to authenticated using (true);

create policy if not exists "P2V2 authenticated users insert PR PO UTR"
on public.pr_po_utr for insert to authenticated with check (true);

create policy if not exists "P2V2 authenticated users update PR PO UTR"
on public.pr_po_utr for update to authenticated using (true) with check (true);

create policy if not exists "P2V2 authenticated users read TAT"
on public.tat_calculation_structure for select to authenticated using (true);

create policy if not exists "P2V2 authenticated users insert TAT"
on public.tat_calculation_structure for insert to authenticated with check (true);

create policy if not exists "P2V2 authenticated users update TAT"
on public.tat_calculation_structure for update to authenticated using (true) with check (true);

-- ============================================================
-- 11. CONTRACT / SERVICE VALIDATION
-- ============================================================

create or replace function public.p2v2_validate_contract_service(
    p_contract_type text,
    p_service_type text
)
returns boolean
language plpgsql
immutable
as $$
begin
    if p_contract_type = 'Others' then
        return true;
    end if;

    if p_service_type = 'Manpower'
       and p_contract_type in ('Commercial', 'Minimum Wages') then
        return true;
    end if;

    if p_service_type in ('Housekeeping', 'Security')
       and p_contract_type = 'Minimum Wages' then
        return true;
    end if;

    return false;
end;
$$;

-- ============================================================
-- 12. APPLY CONTRACT / SERVICE VALIDATION
-- ============================================================

alter table public.invoice_records
    drop constraint if exists invoice_contract_service_valid;

alter table public.invoice_records
    add constraint invoice_contract_service_valid
    check (
        public.p2v2_validate_contract_service(
            contract_type,
            service_type
        )
    );

-- ============================================================
-- 13. VALID WORKFLOW ROUTES
-- ============================================================

create or replace function public.p2v2_valid_route(
    p_from_stage text,
    p_to_stage text
)
returns boolean
language sql
immutable
as $$
    select
        (p_from_stage = 'WH' and p_to_stage = 'VENDOR')
        or (p_from_stage = 'VENDOR' and p_to_stage = 'WH')
        or (p_from_stage = 'WH' and p_to_stage = 'GAC_COMPLIANCE')
        or (p_from_stage = 'GAC_COMPLIANCE' and p_to_stage = 'GAC_PO')
        or (p_from_stage = 'GAC_PO' and p_to_stage = 'ACCOUNTS')
        or (p_from_stage = 'ACCOUNTS' and p_to_stage = 'CBO_OFFICE')
        or (p_from_stage = 'CBO_OFFICE' and p_to_stage = 'CBO_OFFICER')
        or (p_from_stage = 'CBO_OFFICER' and p_to_stage = 'ACCOUNTS');
$$;

-- ============================================================
-- END P2V2 INITIAL DATABASE INSTALL
-- ============================================================

-- Storage bucket to create from Supabase Storage: invoice-documents.
-- Actual invoice/support files must remain in Supabase Storage, not GitHub.
