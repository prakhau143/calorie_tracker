import { Icon } from './Icon.jsx';
import { useTheme } from '../theme/context.js';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      {/* The icon shows the theme you would switch TO, matching the label. */}
      <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
      <span className="theme-toggle__label">{nextTheme}</span>
    </button>
  );
}
