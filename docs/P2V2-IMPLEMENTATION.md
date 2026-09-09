# P2V2 Implementation Specification

## Common UI
All operational dashboards share the company/logo area, centered GAC Bill Payment Portal title, navy base, user name + role, logout and footer. Role-specific cards, tabs, actions and data scope are driven by role configuration.

## Roles
Vendor; Warehouse; GAC — Compliance; GAC — PO; Accounts; CBO Office; CBO Officer. Admin / GOD is a system-level role with unrestricted administration and testing access.

## Routes
### WH-originated MW / Commercial
WH shares applicable operational data → Vendor receives email and Pending for Action item → Vendor uploads invoice and mandatory supporting documents → Vendor submits → WH checks and accepts/queries/returns/rejects → PR Mapping → GAC Compliance → GAC PO → Accounts → CBO Office → CBO Officer → Accounts UTR Mapping → PAID.

### Vendor-originated Others
Vendor selects Project/Location → Invoice Type Other → uploads invoice → optional supporting documents → submits to WH → same downstream flow.

## Contract/service rules
Commercial: Manpower only.
Minimum Wages: Manpower, Housekeeping, Security.
Others: separate Other invoice route.

## Data order
1. User & Role Master
2. Master Data
3. Invoice/Submission Record
4. Document Records
5. Workflow History
6. PR / PO / UTR
7. TAT Calculation Structure

## Controls
- No Submission ID.
- Inv No required.
- Invoice is one file.
- Prescribed supporting documents may have multiple files.
- Mandatory checklist blocks Vendor submission until complete.
- Vendor re-upload is locked after the receiving stage acts.
- TAT does not reset during Vendor re-upload.
- UTR is only final Accounts activity after CBO Officer approval.
- Current status is visible to every authorized user.
- Complete action history stores authority, action, remarks and exact time.

## Status/reporting
Dashboards support search, Month, Year, Company, Project, Location, Vendor, Service, Sub-category, Contract Type and workflow status. Summary reports support unfiltered and filtered runs subject to role access.

## Open implementation configuration
Document version/replacement policy, email CC list, final master values and final WH card/tab wording remain configurable and are not invented by this implementation.
