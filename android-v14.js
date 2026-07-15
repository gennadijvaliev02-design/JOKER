(() => {
  "use strict";

  const LEGACY_TRUMP_SELECTOR = ".trump-pill:has(.trump-card.is-revealed)";

  function removeLegacyTrumpRules(container) {
    let rules;

    try {
      rules = container.cssRules;
    } catch {
      return;
    }

    if (!rules || typeof container.deleteRule !== "function") return;

    for (let index = rules.length - 1; index >= 0; index -= 1) {
      const rule = rules[index];

      if (rule.selectorText?.includes(LEGACY_TRUMP_SELECTOR)) {
        container.deleteRule(index);
        continue;
      }

      if (rule.cssRules) removeLegacyTrumpRules(rule);
    }
  }

  function cleanLegacyRelationalSelectors() {
    for (const stylesheet of document.styleSheets) {
      removeLegacyTrumpRules(stylesheet);
    }
  }

  /* Keep the low-cost paint overrides after the final announcement styles. */
  const stylesheets = [
    ["android-v14-stylesheet", "android-v14.css?v=1"],
    ["android-webview-paint-stylesheet", "android-webview-paint.css?v=3"],
  ];

  for (const [id, href] of stylesheets) {
    if (document.getElementById(id)) continue;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }

  const cleanAfterLoad = () => window.setTimeout(cleanLegacyRelationalSelectors, 0);

  if (document.readyState === "complete") {
    cleanAfterLoad();
  } else {
    window.addEventListener("load", cleanAfterLoad, { once: true });
  }
})();
