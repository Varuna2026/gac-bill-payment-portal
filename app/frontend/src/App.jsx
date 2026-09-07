import './App.css'
import { ROLES, ROLE_LABELS } from './config/roles'
import { NAVIGATION_BY_ROLE } from './config/navigation'

function App() {
  const currentRole = ROLES.WH
  const currentRoleLabel = ROLE_LABELS[currentRole]

  const navigationItems = NAVIGATION_BY_ROLE[currentRole].map((label) => ({
    label,
    active: label === 'Dashboard',
  }))

  return (
    <div className="portal">
      <header className="portal-header">
        <div className="company-logo">
          COMPANY LOGO
        </div>

        <div className="portal-title">
          GAC Bill Payment Portal
        </div>

        <div className="header-user">
          <span className="user-label">User</span>
        </div>
      </header>

      <div className="portal-body">
        <aside className="sidebar">
          <div className="sidebar-heading">
            Navigation
          </div>

          <nav aria-label="Main navigation">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`nav-item ${item.active ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Dashboard</h1>
              <p>
                Welcome to GAC Bill Payment Portal
              </p>
            </div>
          </div>

          <section className="dashboard-grid">
            <div className="summary-card">
              <span className="card-label">Total Invoices</span>
              <strong className="card-value">0</strong>
            </div>

            <div className="summary-card">
              <span className="card-label">Pending</span>
              <strong className="card-value">0</strong>
            </div>

            <div className="summary-card">
              <span className="card-label">Submitted</span>
              <strong className="card-value">0</strong>
            </div>

            <div className="summary-card">
              <span className="card-label">Paid</span>
              <strong className="card-value">0</strong>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <h2>Bill Payment Workflow</h2>
                <p>
                  Invoice and bill processing information will appear here
                  based on the user's assigned role and workflow stage.
                </p>
              </div>

              <button type="button" className="primary-button">
                View Invoices
              </button>
            </div>
          </section>
        </main>
      </div>

      <footer className="portal-footer">
        Copyright © 2026 DB. All rights reserved.
      </footer>
    </div>
  )
}

export default App