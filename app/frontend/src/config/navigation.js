import { ROLES } from './roles'

// P2 universal dashboard: the operational workflow is presented through the same
// standard tab structure for every role. Role-specific exceptions are intentionally
// limited to CBO Officer (Approved) and Accounts (Paid), while Vendor/WH remain
// scoped to their mapped records.
export const NAVIGATION_BY_ROLE = {
  [ROLES.VENDOR]: ['Dashboard', 'Pending for Action', 'Received', 'Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.WH]: ['Dashboard', 'Pending for Action', 'Received', 'Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.GAC_COMPLIANCE]: ['Dashboard', 'Pending for Action', 'Received', 'Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.GAC_PO]: ['Dashboard', 'Pending for Action', 'Received', 'Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.ACCOUNTS]: ['Dashboard', 'Pending for Action', 'Received', 'Under Process', 'Submitted', 'Paid', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.CBO_OFFICE]: ['Dashboard', 'Pending for Action', 'Received', 'Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.CBO_OFFICER]: ['Dashboard', 'Pending for Action', 'Received', 'Under Process', 'Approved', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.ADMIN]: ['Dashboard', 'All Invoices', 'Users & Roles', 'Master Data', 'Workflow Configuration', 'Reports', 'Audit / History', 'Impersonation'],
}
