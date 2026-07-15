(() => {
  "use strict";

  /* Load static V14 styles without parsing a CSS template as JavaScript. */
  if (document.getElementById("android-v14-stylesheet")) return;
  const link = document.createElement("link");
  link.id = "android-v14-stylesheet";
  link.rel = "stylesheet";
  link.href = "android-v14.css?v=1";
  document.head.append(link);
})();
