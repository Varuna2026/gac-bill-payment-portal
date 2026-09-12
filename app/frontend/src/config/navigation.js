import { ROLES } from './roles'

// P2 universal dashboard. Exception handling is role-specific:
// Vendor receives all later-stage Query/Return/Reject items in Re-Submitted.
// Accounts retains Paid for final payment processing.
export const NAVIGATION_BY_ROLE = {
  [ROLES.VENDOR]: ['Dashboard', 'Pending for Action', 'Received & Under Process', 'Submitted', 'Re-Submitted', 'History Record', 'Reports'],
  [ROLES.WH]: ['Dashboard', 'Upload Docs', 'Pending for Action', 'Received & Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.GAC_COMPLIANCE]: ['Dashboard', 'Pending for Action', 'Received & Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.GAC_PO]: ['Dashboard', 'Pending for Action', 'Received & Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.ACCOUNTS]: ['Dashboard', 'Pending for Action', 'Received & Under Process', 'Submitted', 'Paid', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.CBO_OFFICE]: ['Dashboard', 'Pending for Action', 'Received & Under Process', 'Submitted', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.CBO_OFFICER]: ['Dashboard', 'Pending for Action', 'Received & Under Process', 'Submitted', 'Approved', 'Query / Returned / Rejected', 'History Record', 'Reports'],
  [ROLES.ADMIN]: ['Dashboard', 'All Invoices', 'Users & Roles', 'Master Data', 'Workflow Configuration', 'Reports', 'Audit / History', 'Impersonation'],
}
