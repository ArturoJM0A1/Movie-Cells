/**
 * Light / dark mode plumbing.
 *
 * Open Cells theming strategy: the project does not use a theme library. The whole theme is built
 * with CSS custom properties declared in `src/css/colors.css`, where the *public* tokens
 * (`--primary`, `--surface`, ...) delegate to the values of the active scheme
 * (`--primary-dark`, `--surface-dark`, ...). Switching schemes is therefore a single attribute on
 * `:root` — exactly the mechanism the generated demo already used — and we only have to
 * (1) toggle that attribute and (2) remember the choice in `localStorage`.
 */

const STORAGE_KEY = 'movie-cells:theme-mode';
const DARK_ATTRIBUTE = 'color-scheme-dark';

/** Reads the stored preference, falling back to the OS preference and finally to light. */
export function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage can be unavailable (private mode / disabled storage): fall through.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Persists the preference so it survives a reload. */
export function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Persistence is a nice-to-have; never break the UI because of it.
  }
}

/**
 * Applies the scheme to the document.
 *
 * `:root[color-scheme-dark]` is the selector used by `colors.css` and by the shadow roots of the
 * app shell, so setting this one attribute repaints the whole application at once, including the
 * Material Web components (their `--md-*` tokens are derived from our custom properties).
 */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute(DARK_ATTRIBUTE, 'true');
  } else {
    root.removeAttribute(DARK_ATTRIBUTE);
  }
  // Tells the browser to render native widgets (scrollbars, form controls) with the same scheme.
  root.style.colorScheme = mode;
}

/** Opposite mode of the given one. */
export function oppositeTheme(mode: ThemeMode): ThemeMode {
  return mode === 'dark' ? 'light' : 'dark';
}