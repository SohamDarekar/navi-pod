import { createGlobalStyle } from "styled-components";
import { Screen } from "utils/constants";

export const GlobalStyles = createGlobalStyle`
  html {
    -webkit-text-size-adjust: 100%;
    overscroll-behavior-y: contain;
  }

  body {
    height: 100dvh;
    display: grid;
    margin: 0;
    
    color: black;
    min-height: 550px;
    overflow: auto;
    
    /* iOS optimizations */
    position: fixed;
    width: 100%;
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: touch;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;

    ${Screen.XS.MediaQuery} {
      min-height: 480px;
    }
  }

  a {
    color: inherit;
    text-decoration: none;
    -webkit-touch-callout: none;
  }

  * {
    box-sizing: border-box;
    font-family: inherit;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
  }

  input, textarea {
    -webkit-user-select: text;
    user-select: text;
  }

  @media (prefers-color-scheme: dark) {
    html {
      color-scheme: dark;
    }
    body {
      background: black;
    }
  }
`;