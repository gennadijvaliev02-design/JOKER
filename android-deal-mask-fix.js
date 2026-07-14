(() => {
  "use strict";

  /* Keep the real hands fully hidden while Deal 2026 owns the staging piles. */
  if (document.getElementById("android-deal-mask-fix-style")) return;

  const style = document.createElement("style");
  style.id = "android-deal-mask-fix-style";
  style.textContent = `
    .table.is-deal-2026-staging > .hand,
    .table.is-deal-2026-staging > .hidden-cards {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      animation: none !important;
      transition: none !important;
    }

    .table.is-deal-2026-staging > .hand *,
    .table.is-deal-2026-staging > .hidden-cards * {
      opacity: 0 !important;
      visibility: hidden !important;
      animation: none !important;
      transition: none !important;
    }

    .table.is-deal-2026-revealing > .hand,
    .table.is-deal-2026-revealing > .hidden-cards {
      opacity: 1 !important;
      visibility: visible !important;
    }
  `;

  document.head.append(style);
})();
