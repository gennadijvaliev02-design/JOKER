(() => {
  "use strict";

  /* Load static V13 styles without parsing a large CSS template as JavaScript. */
  if (document.getElementById("android-runtime-v13-stylesheet")) return;

  const link = document.createElement("link");
  link.id = "android-runtime-v13-stylesheet";
  link.rel = "stylesheet";
  link.href = "android-runtime-v13.css?v=1";
  document.head.append(link);
})();
