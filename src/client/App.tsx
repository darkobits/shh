import { styled } from 'linaria/react';
import React, {useEffect, useRef, useState} from 'react';


// ----- Styles ----------------------------------------------------------------

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
`;

const DataWrapper = styled.div`
  border-radius: 4px;
  border: 1px solid #383F51;
  position: relative;

  &::after {
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(12, 12, 12, 0.8) 100%);
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    bottom: 0;
    content: ' ';
    display: block;
    height: 16px;
    left: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
  }
`;

const DataScrollContainer = styled.div`
  max-height: calc(90vh - 3em);
  max-width: 80vw;
  overflow: auto;
  padding: 16px 20px 16px 16px;
  position: relative;
`;

const CopyButtonWrapper = styled.div`
  margin-top: 4px;
  text-align: right;
  width: 100%;
`;

const CopyButton = styled.button`
  @keyframes animateBorderColor {
    0%   { border-color: #383F51; }
    5%  { border-color: #36CA75; }
    100%   { border-color: #383F51; }
  }

  appearance: none;
  background-color: transparent;
  border-radius: 4px;
  border: 1px solid;
  border-color: #383F51;
  color: #959595;
  font-size: 12px;
  padding: 10px 12px;
  letter-spacing: 1px;
  transition: color 0.2s ease;

  &:hover {
    cursor: pointer;
    color: #C0C0C0;
  }

  &.animate-border {
    animation: animateBorderColor 2s ease-in;
  }
`;

const Data = styled.div`
  color: #C0C0C0;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  font-weight: 300;
  white-space: pre;


  &:hover {
    cursor: pointer;
  }

  &::selection {
    background-color: #8A8A8A;
  }
`;

const Footer = styled.div`
  width: 100%;
`;

const Message = styled.p`
  color: #C0C0C0;
  font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;
  font-size: 14px;
  font-weight: 200;
  letter-spacing: 0.2px;
  text-align: center;
  user-select: none;
`;

const Warning = styled.span`
  color: rgb(182, 15, 0);
  font-weight: 300;
`;


// ----- Component -------------------------------------------------------------

/**
 * Parses JSON data in the element with the provided ID, removes the element,
 * and returns the results.
 */
function loadData(id: string) {
  try {
    const el = document.querySelector(`#${id}`);

    if (!el) {
      throw new Error(`Data element not found at id "${id}".`);
    }

    const d = JSON.parse(el.innerHTML);
    el.remove();
    return d;
  } catch (err) {
    throw new Error(`Error loading data: ${err.message}`);
  }
}


/**
 * Unselects any selected text/regions on the screen.
 */
function unselectAll() {
  // @ts-ignore
  window.getSelection().removeAllRanges();
}


/**
 * Provided an element reference, selects the contents of the element.
 */
function selectContentsOfElement(el: HTMLElement) {
  if (Reflect.has(document, 'selection')) {
    // @ts-ignore
    const range = document.body.createTextRange();
    range.moveToElementText(el);
    range.select();
  } else if (window.getSelection) {
    const range = document.createRange();
    range.selectNode(el);
    // @ts-ignore
    window.getSelection().removeAllRanges();
    // @ts-ignore
    window.getSelection().addRange(range);
  }
}


/**
 * Provided an element reference, copies the contents of the element to the
 * clipboard.
 */
function copyContentsOfElement(el: HTMLElement) {
  try {
    selectContentsOfElement(el);

    const wasSuccessful = document.execCommand('copy');

    if (!wasSuccessful) {
      throw new Error('Unknown error.');
    }

    return true;
  } catch (err) {
    console.error(`Copy operation failed: ${err.message}`);
  } finally {
    unselectAll();
  }
}


const AppNew: React.FunctionComponent = () => {
  const dataRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const [data, setData] = useState({} as any);


  /**
   * Load data once when the component is mounted.
   */
  useEffect(() => {
    setData(loadData('data'));
  }, []);


  /**
   * Click handler for the data container.
   */
  const handleElementClick = React.useCallback(() => {
    if (!dataRef.current) {
      return;
    }

    selectContentsOfElement(dataRef.current);
  }, [dataRef.current]);


  /**
   * Click handler for the Copy button.
   */
  const handleCopyClick = React.useCallback(() => {
    if (!dataRef.current || !copyRef.current) {
      return;
    }

    const copyEl = copyRef.current;

    const onAnimationEnd = () => {
      copyEl.classList.remove('animate-border');
      copyEl.removeEventListener('animationend', onAnimationEnd);
    };

    copyEl.classList.add('animate-border');
    copyEl.addEventListener('animationend', onAnimationEnd);

    copyContentsOfElement(dataRef.current);
  }, [dataRef.current]);

  console.log('HALLO');


  return (<>
    <Container>
      <DataWrapper>
        <DataScrollContainer>
          <Data
            title="Copy"
            onMouseUp={handleElementClick}
            ref={dataRef}
          >
            {data ? data.data : undefined}
          </Data>
        </DataScrollContainer>
      </DataWrapper>
      <CopyButtonWrapper>
        <CopyButton ref={copyRef} onClick={handleCopyClick}>
          COPY <i className="far fa-copy" />
        </CopyButton>
      </CopyButtonWrapper>
    </Container>
    <Footer>
      {data.stop && <Message>Server is no longer online. <Warning>Refreshing the page will result in loss of data.</Warning></Message>}
    </Footer>
  </>);
};


export default AppNew;
