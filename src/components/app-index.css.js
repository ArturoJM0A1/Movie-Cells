import { css } from 'lit';

/**
 * Styles of `<app-index>`, the application shell.
 *
 * The shell does not redeclare the palette: it inherits the design tokens from `:root`
 * (`src/css/colors.css`), so switching the theme is a single attribute flip on `<html>`. The few
 * `--md-*` values declared here only tune the Material components rendered *inside this shadow
 * root* (the header icon button), because they cannot be styled from the global stylesheet.
 */
export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    background-color: var(--surface);
    color: var(--on-surface);
  }

  header {
    width: 100%;
    padding: 0 1rem;
    box-sizing: border-box;
    background-color: var(--surface);
    color: var(--primary);
    /* The token already carries the alpha of the current theme. */
    position: relative;
    z-index: 2;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    padding: 1rem 0;
  }

  /* Fade under the header so content scrolling below it does not clash with the title. */
  .header-content::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -1.5rem;
    width: 100%;
    height: 2.75rem;
    z-index: -1;
    background: linear-gradient(0deg, rgba(255, 255, 255, 0) 0%, var(--header-gradient) 100%);
    pointer-events: none;
  }

  .header-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  h1 {
    font-size: 1.5rem;
    line-height: 1.5rem;
    font-weight: 400;
  }

  a {
    text-decoration: none;
    color: var(--primary);
  }

  main {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  /* The router outlet: the Cells router inserts the current page inside this slot. */
  main ::slotted(*) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--surface);
  }

  /* 1024px */
  @media (min-width: 64rem) {
    header {
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 58rem;
      height: 7rem;
      margin: 0 auto;
      transition: height 0.2s ease-in-out;
      will-change: height;
    }

    header.scrolled {
      height: 4.5rem;
    }
  }

  /* 1440px */
  @media (min-width: 90rem) {
    header {
      max-width: 71.5rem;
    }
  }

  /* 800px */
  @media (prefers-reduced-motion: reduce) {
    header {
      transition: none;
    }
  }
`;