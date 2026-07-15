(() => {
  "use strict";

  /* Keep the low-cost paint overrides after the final announcement styles. */
  const stylesheets = [
    ["android-v14-stylesheet", "android-v14.css?v=1"],
    ["android-webview-paint-stylesheet", "android-webview-paint.css?v=2"],
  ];

  for (const [id, href] of stylesheets) {
    if (document.getElementById(id)) continue;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }
})();
