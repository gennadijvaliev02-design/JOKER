(() => {
  "use strict";

  /* Load static Android styles without parsing CSS templates as JavaScript. */
  const stylesheets = [
    ["android-runtime-v13-stylesheet", "android-runtime-v13.css?v=1"],
    ["android-webview-paint-stylesheet", "android-webview-paint.css?v=1"],
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
