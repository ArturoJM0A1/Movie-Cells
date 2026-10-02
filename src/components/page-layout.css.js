import { css } from 'lit';

/**
 * Styles of `<page-layout>`.
 *
 * The layout does not define its own palette: it consumes the global design tokens declared in
 * `src/css/colors.css` (`--surface`, `--on-surface`, ...), which are re-declared by
 * `color-scheme-dark` on `:root`. That is what makes the dark theme work for every page and every
 * Web Component at once, without a single `@media (prefers-color-scheme)` here.
 */
export const styles = css`
  :host {
    box-sizing: border-box;
    background-color: var(--surface);
    color: var(--on-surface);
    overflow: hidden;
  }

  .scroller {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-top: 1.5rem;
  }

  .region {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .zone {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0 1rem;
    box-sizing: border-box;
  }

  .footer {
    border-top: 1px solid var(--outline-variant, #cac4d0);
  }

  .footer-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    padding: 2rem 0 2.5rem;
    font-size: 0.875rem;
    color: var(--on-surface-variant, #524b5c);
  }

  .footer-content p {
    margin: 0;
  }

  a {
    color: var(--primary, #7b3fe4);
  }

  a:hover,
  a:focus {
    color: var(--on-surface, #1b1820);
  }

  /* 768px */
  @media (min-width: 48rem) {
    .content {
      padding-top: 2.5rem;
    }

    .footer-content {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  /* 1024px */
  @media (min-width: 60rem) {
    .zone,
    .footer-content {
      max-width: 58rem;
      margin: 0 auto;
    }
  }

  /* 1440px */
  @media (min-width: 90rem) {
    .zone,
    .footer-content {
      max-width: 71.5rem;
    }
  }

  /* 800px */
  @media (prefers-reduced-motion: reduce) {
    .scroller {
      scroll-behavior: auto;
    }
  }
`;