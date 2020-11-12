import {css} from 'linaria';


export default css`
  :global() {
    html, body, #root {
      box-sizing: border-box;
      height: 100%;
      margin: 0;
      padding: 0;
      width: 100%;
    }

    #root {
      align-items: center;
      background-color: rgb(12, 12, 12);
      background: linear-gradient(135deg, rgb(32, 32, 42), rgb(8, 8, 12));
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    *, *:before, *:after {
      box-sizing: inherit;
    }

    *:focus {
      outline: none;
    }
  }
`;
