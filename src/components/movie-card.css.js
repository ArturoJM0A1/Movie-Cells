import { css } from 'lit';

/** Styles of `<movie-card>`. Layout + spacing only; the visuals come from Material Web tokens. */
export const styles = css`
  :host {
    display: block;
    height: 100%;
  }

  md-icon[filled] {
    font-variation-settings: 'FILL' 1;
  }

  article {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;
    background-color: var(--surface-container);
    border-radius: 0.75rem;
    border-bottom-left-radius: 1.5rem;
  }

  .poster {
    position: relative;
    width: 100%;
    height: 16rem;
    overflow: hidden;
    border-radius: var(--border-radius-img, 0.5rem);
    background-color: var(--surface-container-highest, #e6def0);
  }

  .poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .poster-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--on-surface-variant, #524b5c);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 400;
    color: var(--on-surface, #1b1820);
  }

  .meta {
    margin: 0;
    font-size: 0.875rem;
    color: var(--on-surface-variant, #524b5c);
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--primary, #7b3fe4);
  }

  md-chip-set {
    margin-top: auto;
  }

  md-filled-tonal-button {
    width: 100%;
  }
`;