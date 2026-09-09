export const ROLES = {
  VENDOR: 'VENDOR',
  WH: 'WH',
  GAC_COMPLIANCE: 'GAC_COMPLIANCE',
  GAC_PO: 'GAC_PO',
  ACCOUNTS: 'ACCOUNTS',
  CBO_OFFICE: 'CBO_OFFICE',
  CBO_OFFICER: 'CBO_OFFICER',
  ADMIN: 'ADMIN',
}

export const ROLE_LABELS = {
  VENDOR: 'Vendor',
  WH: 'Warehouse',
  GAC_COMPLIANCE: 'GAC — Compliance',
  GAC_PO: 'GAC — PO',
  ACCOUNTS: 'Accounts',
  CBO_OFFICE: 'CBO Office',
  CBO_OFFICER: 'CBO Officer',
  ADMIN: 'Admin / GOD',
}

export const OPERATIONAL_ROLES = Object.keys(ROLES)
  .filter((key) => key !== 'ADMIN')
  .map((key) => ROLES[key])

export const isAdmin = (role) => role === ROLES.ADMIN
