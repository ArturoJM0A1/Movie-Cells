import { css } from 'lit';

/** Styles of `<movie-pagination>`. The host collapses when there is nothing to paginate. */
export const styles = css`
  :host {
    display: block;
  }

  nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 1rem 0;
  }

  .label {
    min-width: 9rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--on-surface-variant, #524b5c);
  }
`;