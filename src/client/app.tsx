import React, {useEffect, useRef, useState} from 'react';
import {keyframes} from '@emotion/core';
import styled from '@emotion/styled';

import Global from 'client/global';


// ----- Styles ----------------------------------------------------------------

const animateBorderColor = (fromColor: string, toColor: string) => keyframes`
  0%   { border-color: ${fromColor}; }
  50%  { border-color: ${toColor}; }
  100% { border-color: ${fromColor}; }
`;

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
  appearance: none;
  background-color: transparent;
  border-radius: 4px;
  border: 1px solid;
  border-color: #383F51;
  color: #C0C0C0;
  font-size: 16px;
  max-height: 32px;
  max-width: 32px;
  min-height: 32px;
  min-width: 32px;
  padding: 6px;
  transition: border-color 0.1s ease;

  /* &.on-click {
    animation: ${animateBorderColor('#383F51', '#36CA75')} 0.5s ease-in-out;
  } */

  &:hover {
    cursor: pointer;
  }

  &:active {
    border-color: #36CA75;
    color: #A0A0A0;
    font-size: 15px;
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
  font-size: 12px;
  font-weight: 100;
  letter-spacing: 0.2px;
  text-align: center;
  user-select: none;
`;

const Warning = styled.span`
  color: rgb(182, 15, 0);
`;


// ----- Component -------------------------------------------------------------

/**
 * Parses JSON data in the element with the provided ID, removes the element,
 * and returns the results.
 */
function loadData(id: string) {
  try {
    const el = document.getElementById(id);

    if (!el) {
      throw new Error('Data element not found.');
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


export default () => {
  const dataRef = useRef<HTMLDivElement>(null); // tslint:disable-line no-null-keyword
  const copyRef = useRef<HTMLButtonElement>(null); // tslint:disable-line no-null-keyword
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
  function handleElementClick() {
    if (!dataRef.current) {
      return;
    }

    selectContentsOfElement(dataRef.current);
  }


  /**
   * Click handler for the Copy button.
   */
  function handleCopyClick() {
    if (!dataRef.current || !copyRef.current) {
      return;
    }

    const copyEl = copyRef.current;

    const onAnimationEnd = () => {
      copyEl.classList.remove('on-click');
      copyEl.removeEventListener('animationend', onAnimationEnd);
    };

    copyEl.classList.add('on-click');
    copyEl.addEventListener('animationend', onAnimationEnd);

    copyContentsOfElement(dataRef.current);
  }


  return (<>
    <Global />
    <Container>
      <DataWrapper>
        <DataScrollContainer>
          <Data ref={dataRef} onMouseUp={handleElementClick} title='Copy'>
            {data ? data.data : undefined}
          </Data>
        </DataScrollContainer>
      </DataWrapper>
      <CopyButtonWrapper>
        <CopyButton ref={copyRef} onClick={handleCopyClick}>
          <i className='far fa-copy'></i>
        </CopyButton>
      </CopyButtonWrapper>
    </Container>
    <Footer>
      {data.stop && <Message>Server is no longer online. <Warning>Refreshing the page will result in loss of data.</Warning></Message>}
    </Footer>
  </>);
};
