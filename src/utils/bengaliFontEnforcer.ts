/**
 * BD. CivilLab — Bengali Typography & Nikosh Font Enforcer
 * 
 * Ensures all Bengali script characters (U+0980 to U+09FF) throughout the entire
 * application strictly and reactively render in the authentic Nikosh font.
 */

const BENGALI_CHAR_REGEX = /[\u0980-\u09FF]/;

const CHART_TEXT_SELECTORS = [
  'svg text',
  'svg tspan',
  '.recharts-surface text',
  '.recharts-surface tspan',
  '.recharts-text',
  '.recharts-label',
  '.recharts-cartesian-axis text',
  '.recharts-cartesian-axis-tick text',
  '.recharts-cartesian-axis-tick-value',
  '.recharts-legend-item-text',
  '.recharts-default-tooltip',
  '.recharts-tooltip-label',
  '.recharts-tooltip-item',
  '.d3-axis text',
  '.d3-label',
  '.d3-tooltip',
  '.axis text',
  '.axis-label',
  '.axis-title',
  '.tick text',
  '.chart-label',
  '.chart-axis-label',
  '.chart-title',
  '.chart-tick-label',
  '.diagram-label'
].join(',');

/**
 * Enforces Nikosh font family directly on all D3, Recharts, and SVG chart labels and axis titles
 */
export function applyNikoshFontToCharts(rootNode: Node = document.body): void {
  if (typeof window === 'undefined' || !rootNode) return;
  try {
    const el = rootNode as Element;
    if (el.querySelectorAll) {
      const nodes = el.querySelectorAll<SVGTextElement | HTMLElement>(CHART_TEXT_SELECTORS);
      nodes.forEach((node) => {
        node.style.setProperty('font-family', "'Nikosh', 'NikoshBAN', 'SolaimanLipi', sans-serif", 'important');
        if (!node.classList.contains('font-nikosh')) {
          node.classList.add('font-nikosh');
        }
      });
    }
  } catch {
    // Graceful degradation
  }
}

/**
 * Traverses DOM tree and marks elements containing Bengali text with font-nikosh
 */
export function applyNikoshFontToBengaliText(rootNode: Node = document.body): void {
  if (typeof window === 'undefined' || !rootNode) return;

  try {
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !BENGALI_CHAR_REGEX.test(node.nodeValue)) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          // Skip script, style, and purely graphic paths
          const tag = parent.tagName.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'path' || tag === 'polygon' || tag === 'polyline' || tag === 'line') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      const parent = currentNode.parentElement;
      if (parent && !parent.classList.contains('font-nikosh')) {
        parent.classList.add('font-nikosh');
        parent.style.setProperty('font-family', "'Nikosh', 'NikoshBAN', 'SolaimanLipi', sans-serif", 'important');
        if (!parent.getAttribute('lang')) {
          parent.setAttribute('lang', 'bn');
        }
      }
      currentNode = walker.nextNode();
    }
  } catch (err) {
    // Graceful degradation for restricted contexts
  }
}

/**
 * Initializes the reactive MutationObserver and FontFace registration
 */
export function initializeNikoshFontEnforcer(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Explicitly register FontFace with the browser font cache if supported
  if ('fonts' in document && typeof FontFace !== 'undefined') {
    try {
      const woff2Face = new FontFace(
        'Nikosh',
        "url('https://cdn.jsdelivr.net/gh/sonnetdp/nikosh@master/fonts/Nikosh.woff2') format('woff2'), url('/fonts/Nikosh.woff2') format('woff2')",
        { weight: '100 900', style: 'normal', display: 'swap' }
      );
      woff2Face.load().then((loaded) => {
        document.fonts.add(loaded);
        applyNikoshFontToBengaliText(document.body);
        applyNikoshFontToCharts(document.body);
      }).catch(() => {
        // Fallback already covered by embedded CSS in nikoshFont.css
      });
    } catch {
      // Ignored
    }
  }

  // 2. Initial execution once DOM is ready
  const runInitial = () => {
    applyNikoshFontToBengaliText(document.body);
    applyNikoshFontToCharts(document.body);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitial);
  } else {
    runInitial();
  }

  // 3. Reactive MutationObserver to continuously style dynamically rendered Bengali text & chart components
  try {
    const observer = new MutationObserver((mutations) => {
      let shouldScanBengali = false;
      let shouldScanCharts = false;

      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (let i = 0; i < m.addedNodes.length; i++) {
            const node = m.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const tag = el.tagName?.toLowerCase();
              if (tag === 'svg' || tag === 'text' || tag === 'g' || el.classList?.contains('recharts-wrapper') || el.querySelector?.('svg, text, .recharts-surface, .d3-axis')) {
                shouldScanCharts = true;
              }
              if (el.textContent && BENGALI_CHAR_REGEX.test(el.textContent)) {
                shouldScanBengali = true;
                applyNikoshFontToBengaliText(el);
              }
            } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue && BENGALI_CHAR_REGEX.test(node.nodeValue)) {
              if (node.parentElement && !node.parentElement.classList.contains('font-nikosh')) {
                node.parentElement.classList.add('font-nikosh');
                node.parentElement.style.setProperty('font-family', "'Nikosh', 'NikoshBAN', 'SolaimanLipi', sans-serif", 'important');
                if (!node.parentElement.getAttribute('lang')) {
                  node.parentElement.setAttribute('lang', 'bn');
                }
              }
            }
          }
        } else if (m.type === 'characterData' && m.target) {
          const text = m.target.nodeValue;
          if (text && BENGALI_CHAR_REGEX.test(text)) {
            const parent = m.target.parentElement;
            if (parent && !parent.classList.contains('font-nikosh')) {
              parent.classList.add('font-nikosh');
              parent.style.setProperty('font-family', "'Nikosh', 'NikoshBAN', 'SolaimanLipi', sans-serif", 'important');
              if (!parent.getAttribute('lang')) {
                parent.setAttribute('lang', 'bn');
              }
            }
          }
        }
      }

      if (shouldScanCharts) {
        applyNikoshFontToCharts(document.body);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  } catch (err) {
    console.warn('[BD. CivilLab] Font enforcer observer warning:', err);
  }
}
