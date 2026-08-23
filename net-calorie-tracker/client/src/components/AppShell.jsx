import { ThemeToggle } from './ThemeToggle.jsx';

export function AppShell({ leading, title, children }) {
  return (
    <div className="app-shell">
      <header className="app-header glass-panel">
        <div className="app-header__leading">{leading}</div>
        <div className="app-header__brand">
          {title ?? (
            <>
              <img className="app-header__logo" src="/brand/netcal-mark.svg" alt="" width="28" height="28" />
              <span className="app-header__mark">NET//CAL</span>
              <span className="app-header__tagline">Net Calorie Tracker</span>
            </>
          )}
        </div>
        <div className="app-header__trailing">
          <ThemeToggle />
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
