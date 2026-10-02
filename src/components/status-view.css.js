import { css } from 'lit';

/** Styles of `<status-view>`. It hides itself when no state is set. */
export const styles = css`
  :host {
    display: none;
    width: 100%;
  }

  :host([state]) {
    display: flex;
  }

  md-icon[filled] {
    font-variation-settings: 'FILL' 1;
  }

  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    width: 100%;
    min-height: 12rem;
    padding: 3rem 1.5rem;
    box-sizing: border-box;
    text-align: center;
    background-color: var(--surface-container, #f3eefa);
    border-radius: 0.75rem;
    color: var(--on-surface, #1b1820);
  }

  .message {
    max-width: 32rem;
    color: var(--on-surface-variant, #524b5c);
  }

  md-filled-tonal-button {
    flex-shrink: 0;
  }
`;