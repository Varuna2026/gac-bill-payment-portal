import './App.css'

function App() {
  return (
    <div className="portal">
      <header className="portal-header">
        <div className="company-logo">
          COMPANY LOGO
        </div>

        <div className="portal-title">
          GAC Bill Payment Portal
        </div>

        <div className="header-space" />
      </header>

      <div className="portal-body">
        <aside className="sidebar">
          <div className="sidebar-heading">Dashboard</div>

          <nav>
            <button type="button" className="nav-item active">
              Home
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Dashboard</h1>
            <p>Welcome to GAC Bill Payment Portal</p>
          </div>

          <section className="dashboard-card">
            <h2>Bill Payment Workflow</h2>
            <p>
              Your workflow options and invoice information will appear here
              based on your assigned role and stage.
            </p>
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