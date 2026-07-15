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

  /* Keep paint cleanup and safe-area protection after all earlier Android layers. */
  const stylesheets = [
    ["android-v14-stylesheet", "android-v14.css?v=1"],
    ["android-webview-paint-stylesheet", "android-webview-paint.css?v=3"],
    ["android-safe-area-stylesheet", "android-safe-area.css?v=1"],
  ];

  for (const [id, href] of stylesheets) {
    if (document.getElementById(id)) continue;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }

  function loadAndroidSystemIntegration() {
    if (document.getElementById("android-system-integration-script")) return;

    const script = document.createElement("script");
    script.id = "android-system-integration-script";
    script.src = "android-system-integration.js?v=1";
    script.async = false;
    document.body.append(script);
  }

  const finishAfterLoad = () => window.setTimeout(() => {
    cleanLegacyRelationalSelectors();
    loadAndroidSystemIntegration();
  }, 0);

  if (document.readyState === "complete") {
    finishAfterLoad();
  } else {
    window.addEventListener("load", finishAfterLoad, { once: true });
  }
})();
