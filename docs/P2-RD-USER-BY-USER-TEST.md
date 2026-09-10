# P2 R&D User-by-User Test

## Test records
- `P2-TEST-WH-001`: VWPL → Apollo Tepla → Jyoti Enterprises → Manpower → Regular/Monthly → Minimum Wages. WH initiated.
- `P2-TEST-VENDOR-001`: VWPL → Apollo Tepla → Jyoti Enterprises → HK → Regular/Monthly → Minimum Wages. Vendor initiated.

## User sequence — Route 1
1. Warehouse: receive `P2-TEST-WH-001`, verify mapped Apollo Tepla/Jyoti/Manpower context, add PR, submit to GAC Compliance.
2. Vendor: verify only mapped Jyoti context is visible, review WH documents, invoice/supporting documents, submit back to WH.
3. Warehouse: accept vendor bill, PR mapping, submit to GAC Compliance.
4. GAC Compliance: accept, perform compliance check, submit to GAC PO. No PO Mapping here.
5. GAC PO: accept and perform PO Mapping, submit to Accounts.
6. Accounts: accept, submit to CBO Office.
7. CBO Office: accept, submit to CBO Officer.
8. CBO Officer: approve for payment, submit to Accounts.
9. Accounts: UTR Mapping, final PAID.

## User sequence — Route 2
1. Vendor: initiate `P2-TEST-VENDOR-001`.
2. Warehouse: receive, check/accept, perform PR mapping, submit to GAC Compliance.
3. Continue with GAC Compliance → GAC PO → Accounts → CBO Office → CBO Officer → Accounts/PAID as above.

## Negative tests
- Vendor must not see unrelated warehouses/vendors.
- Warehouse must not see unrelated warehouse data.
- Jyoti Enterprises must not see GDX, Apex Services, Immigration Security Services Pvt Ltd, etc.
- Apollo Tepla must not expose unrelated vendor/service combinations.
- GAC Compliance must not show PO Mapping.
- GAC PO alone performs PO Mapping.
- Final Accounts after CBO Officer approval exposes UTR Mapping/PAID, not normal downstream approval actions.
- Invalid Query/Return/Reject destination must be blocked.
- Duplicate invoice number must be rejected by the database layer before production database migration.

## TAT tests
- Individual TAT starts at the exact stage-entry timestamp and ends at the next workflow action.
- Cumulative TAT starts at the route's initial trigger and continues through every stage.
- Query/Return correction time is included; TAT does not pause or reset.
- PAID freezes cumulative TAT at UTR Mapping time.
- Sundays and the configured 3 national holidays are counted separately.
