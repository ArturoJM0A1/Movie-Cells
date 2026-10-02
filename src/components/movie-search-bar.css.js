import { css } from 'lit';

/**
 * Styles of `<movie-search-bar>`.
 *
 * The component is rendered inside the *light DOM* of the pages (Open Cells pages use
 * `createRenderRoot() { return this }` so the global stylesheet applies), but it keeps its own
 * shadow root for its internals. Here we only do layout/spacing: every control is a Material Web
 * component shipped with the Open Cells stack.
 */
export const styles = css`
  :host {
    display: block;
    width: 100%;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  md-filled-button {
    --md-filled-button-container-shape: 2rem;
  }

  /* 768px */
  @media (min-width: 48rem) {
    form {
      flex-direction: row;
      align-items: center;
    }

    md-filled-button {
      height: 3.5rem;
      padding: 0 1.75rem;
      white-space: nowrap;
    }
  }
`;