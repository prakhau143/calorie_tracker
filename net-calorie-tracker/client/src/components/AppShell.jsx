export function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header glass-panel">
        <div className="app-header__brand">
          <span className="app-header__mark">NET//CAL</span>
          <span className="app-header__tagline">Net Calorie Tracker</span>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
