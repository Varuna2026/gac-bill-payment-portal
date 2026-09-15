import { useEffect, useMemo, useState } from 'react'
// P2 Vendor Submit flow confirmed: Submit to Warehouse is wired directly to submit().
import { NAVIGATION_BY_ROLE } from './config/navigation'
import { ROLE_LABELS, ROLES } from './config/roles'
import { WORKFLOW_STATUS } from './config/workflow'
import { P2_MASTER_MAPPINGS, P2_SUB_SERVICES, P2_USERS } from './data/p2Seed'