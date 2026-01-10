import { useState, useRef, useEffect, useCallback } from 'react';
import { HtmlEditor } from './components/HtmlEditor';
import { SelectorPanel } from './components/SelectorPanel';
import { mapSelectorsToLines, getLineCount, type SelectorWithTiming } from './utils/selectorMapper';
import { formatHtml } from './utils/formatHtml';

const SAMPLE_HTML = `<div class="container">
  <header>
    <h1>Hello World</h1>
  </header>
  <main>
    <p>First paragraph</p>
    <p>Second paragraph</p>
  </main>
</div>`;

function App() {
  const [htmlSource, setHtmlSource] = useState(SAMPLE_HTML);
  const [selectorsByLine, setSelectorsByLine] = useState<Map<number, SelectorWithTiming[]>>(new Map());
  const [totalTimeMs, setTotalTimeMs] = useState(0);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSelectors = useCallback(() => {
    if (!containerRef.current) return;

    // Update the hidden container with the HTML
    containerRef.current.innerHTML = htmlSource;

    // Generate selectors
    const result = mapSelectorsToLines(htmlSource, containerRef.current);
    setSelectorsByLine(result.selectorsByLine);
    setTotalTimeMs(result.totalTimeMs);
  }, [htmlSource]);

  useEffect(() => {
    updateSelectors();
  }, [updateSelectors]);

  const lineCount = getLineCount(htmlSource);

  const handleFormat = () => {
    setHtmlSource(formatHtml(htmlSource));
  };

  return (
    <div className="app">
      <div className="app-title">
        <h1>CSS Selector Generator Sandbox</h1>
        <p>
          A playground for testing{' '}
          <a href="https://github.com/fczbkk/css-selector-generator#readme">css-selector-generator</a>,
          a JavaScript library that generates unique CSS selectors for any HTML element.
        </p>
      </div>
      <div className="headers">
        <div className="panel-header">
          HTML
          <button className="format-btn" onClick={handleFormat}>Format</button>
        </div>
        <div className="panel-header">
          CSS Selectors
          <span className="total-time">
            {totalTimeMs.toFixed(2)} ms
            <button
              className="info-btn"
              onClick={() => setShowInfoPopover(!showInfoPopover)}
            >
              i
            </button>
            {showInfoPopover && (
              <div className="info-popover">
                <p>Total time to generate all CSS selectors.</p>
                <p>Hover over individual selectors to see their generation time.</p>
              </div>
            )}
          </span>
        </div>
      </div>
      <div className="panels-content">
        <div className="panel-column">
          <HtmlEditor value={htmlSource} onChange={setHtmlSource} />
        </div>
        <div className="panel-column">
          <SelectorPanel selectorsByLine={selectorsByLine} lineCount={lineCount} />
        </div>
      </div>
      <div ref={containerRef} className="hidden-container" />
    </div>
  );
}

export default App;
