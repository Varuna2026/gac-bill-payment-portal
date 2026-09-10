import { ROLES } from './roles'

export const NAVIGATION_BY_ROLE = {
  [ROLES.VENDOR]: ['Dashboard', 'Pending for Action', 'Submit Invoice', 'Submitted', 'Query / Returned / Rejected', 'Approved', 'History / Records', 'Reports'],
  [ROLES.WH]: ['Dashboard', 'Upload Documents', 'Pending for Action', 'Submitted', 'Query / Returned / Rejected', 'History / Records', 'Reports'],
  [ROLES.GAC_COMPLIANCE]: ['Dashboard', 'Pending for Action', 'Accepted', 'Under Compliance Check', 'Compliance Checked', 'Query / Returned / Rejected', 'History / Records', 'Reports'],
  [ROLES.GAC_PO]: ['Dashboard', 'Pending', 'Accepted', 'Query / Returned / Rejected', 'PO Mapping', 'History / Records', 'Reports'],
  [ROLES.ACCOUNTS]: ['Dashboard', 'Submitted', 'Pending', 'Query / Returned / Rejected', 'UTR Mapping', 'History / Records', 'Reports'],
  [ROLES.CBO_OFFICE]: ['Dashboard', 'Submitted', 'Pending', 'Query / Returned / Rejected', 'Approval / Actions', 'History / Records', 'Reports'],
  [ROLES.CBO_OFFICER]: ['Dashboard', 'Pending for Approval', 'Approved', 'Query / Returned / Rejected', 'History / Records', 'Reports'],
  [ROLES.ADMIN]: ['Dashboard', 'All Invoices', 'Users & Roles', 'Master Data', 'Workflow Configuration', 'Reports', 'Audit / History', 'Impersonation'],
}
