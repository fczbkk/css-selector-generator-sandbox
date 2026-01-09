import { getCssSelector } from 'css-selector-generator';

interface TagInfo {
  tagName: string;
  lineNumber: number;
}

// Parse HTML source to find all opening tags and their line numbers
function parseOpeningTags(htmlSource: string): TagInfo[] {
  const tags: TagInfo[] = [];
  const lines = htmlSource.split('\n');

  // Regex to match opening tags (not closing tags, not self-closing)
  // Matches: <tagname or <tagname attributes...
  const openingTagRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*(?<!\/)\s*>/g;
  // Also match self-closing tags
  const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/\s*>/g;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Find all opening tags in this line
    let match;

    // Reset regex lastIndex for each line check
    openingTagRegex.lastIndex = 0;
    while ((match = openingTagRegex.exec(line)) !== null) {
      tags.push({
        tagName: match[1].toLowerCase(),
        lineNumber: lineIndex,
      });
    }

    // Also handle self-closing tags (they still create elements)
    selfClosingRegex.lastIndex = 0;
    while ((match = selfClosingRegex.exec(line)) !== null) {
      tags.push({
        tagName: match[1].toLowerCase(),
        lineNumber: lineIndex,
      });
    }

  }

  return tags;
}

// Get all elements from a container in document order
function getAllElements(container: Element): Element[] {
  const elements: Element[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  let node = walker.nextNode();
  while (node) {
    elements.push(node as Element);
    node = walker.nextNode();
  }

  return elements;
}

export interface SelectorWithTiming {
  selector: string;
  timeMs: number;
}

export interface MapSelectorsResult {
  selectorsByLine: Map<number, SelectorWithTiming[]>;
  totalTimeMs: number;
}

// Main function: map HTML source to CSS selectors by line number
export function mapSelectorsToLines(
  htmlSource: string,
  container: Element
): MapSelectorsResult {
  const selectorsByLine = new Map<number, SelectorWithTiming[]>();
  const totalStart = performance.now();

  if (!htmlSource.trim()) {
    return { selectorsByLine, totalTimeMs: 0 };
  }

  // Parse source to get tag positions
  const tagInfos = parseOpeningTags(htmlSource);

  // Get all elements from the rendered container
  const elements = getAllElements(container);

  // Match elements to their source positions
  // We track tag index per tag name to handle matching
  const tagCounters: Record<string, number> = {};

  // Build a map: for each tag name, list of line numbers where it appears
  const tagLineMap: Record<string, number[]> = {};
  for (const info of tagInfos) {
    if (!tagLineMap[info.tagName]) {
      tagLineMap[info.tagName] = [];
    }
    tagLineMap[info.tagName].push(info.lineNumber);
  }

  // For each DOM element, find its corresponding source line
  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();

    // Initialize counter for this tag name if needed
    if (tagCounters[tagName] === undefined) {
      tagCounters[tagName] = 0;
    }

    const tagIndex = tagCounters[tagName];
    const linesForTag = tagLineMap[tagName] || [];

    if (tagIndex < linesForTag.length) {
      const lineNumber = linesForTag[tagIndex];

      // Generate CSS selector for this element with timing
      try {
        const start = performance.now();
        const selector = getCssSelector(element, { root: container });
        const timeMs = performance.now() - start;

        if (!selectorsByLine.has(lineNumber)) {
          selectorsByLine.set(lineNumber, []);
        }
        selectorsByLine.get(lineNumber)!.push({ selector, timeMs });
      } catch (e) {
        // Skip elements that can't generate selectors
      }
    }

    tagCounters[tagName]++;
  }

  const totalTimeMs = performance.now() - totalStart;
  return { selectorsByLine, totalTimeMs };
}

// Get total line count from source
export function getLineCount(htmlSource: string): number {
  if (!htmlSource) return 0;
  return htmlSource.split('\n').length;
}
