import { css } from 'lit';

/**
 * Styles of `theme-toggle`.
 *
 * The component lives in the shadow root of `app-index`, and the shell resolves the
 * `--md-outlined-icon-button-*` tokens from the global palette, so they are inherited down to the
 * Material Web component rendered here and follow the light/dark theme with no extra work.
 */
export const styles = css`
  :host {
    display: inline-flex;
    align-items: center;
  }

  /* The "filled" variant of md-icon is activated through this Material Symbols axis. */
  md-icon[filled] {
    font-variation-settings: 'FILL' 1;
  }
`;