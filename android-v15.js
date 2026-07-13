(() => {
  const V15_CSS = String.raw`
    /* Android V15 — glow only. No layout, sizing, colour or gameplay changes. */

    /* Trump card: keep the glass card, reduce only its glow by about 40%. */
    .trump-pill.v13-trump-ready .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.36),
        0 0 10px rgba(255,216,102,.17),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 12px rgba(255,255,255,.35) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="red"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.38),
        0 0 7px rgba(255,255,255,.19),
        0 0 14px rgba(255,73,96,.23),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 13px rgba(255,255,255,.38) !important;
    }

    .trump-pill.v13-trump-ready[data-v13-suit="black"] .trump-card {
      box-shadow:
        0 0 0 1px rgba(255,255,255,.45),
        0 0 8px rgba(255,255,255,.37),
        0 0 14px rgba(190,234,255,.15),
        0 8px 18px rgba(0,0,0,.34),
        inset 0 0 14px rgba(255,255,255,.44) !important;
    }

    /* Trump choice and Joker High/Take panels: reduce only luminous halos by about 70%. */
    .bid-panel.is-v12-trump-panel,
    .bid-panel.is-v12-joker-suit-panel {
      box-shadow:
        0 28px 66px rgba(0,0,0,.64),
        0 0 0 1px rgba(255,255,255,.07),
        0 0 16px rgba(226,185,83,.066),
        0 0 20px rgba(42,234,183,.045),
        inset 0 1px 0 rgba(255,255,255,.20),
        inset 0 -25px 42px rgba(0,0,0,.35) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option {
      box-shadow:
        0 13px 27px rgba(0,0,0,.45),
        0 0 10px rgba(48,229,185,.048),
        inset 0 1px 0 rgba(255,255,255,.22),
        inset 0 -13px 21px rgba(0,0,0,.33),
        inset 0 0 14px rgba(67,242,199,.018) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="hearts"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="diamonds"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="hearts"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="diamonds"] .android-joker-suit-symbol {
      text-shadow:
        0 1px 0 rgba(255,255,255,.35),
        0 0 5px rgba(255,255,255,.075),
        0 0 8px rgba(255,72,95,.216),
        0 0 14px rgba(255,44,75,.102),
        0 3px 5px rgba(0,0,0,.66) !important;
      filter: drop-shadow(0 0 3px rgba(255,73,96,.12)) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="clubs"],
    .bid-panel.is-v12-trump-panel .bid-option[data-trump="spades"],
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="clubs"] .android-joker-suit-symbol,
    .bid-panel.is-v12-joker-suit-panel .android-joker-suit-option[data-joker-lead-suit="spades"] .android-joker-suit-symbol {
      text-shadow:
        0 1px 0 rgba(255,255,255,.42),
        0 0 4px rgba(255,255,255,.288),
        0 0 8px rgba(255,255,255,.216),
        0 0 14px rgba(186,229,255,.12),
        0 3px 5px rgba(0,0,0,.76) !important;
      filter: drop-shadow(0 0 3px rgba(255,255,255,.186)) !important;
    }

    .bid-panel.is-v12-trump-panel .bid-option[data-trump="no-trump"] {
      text-shadow:
        0 2px 4px rgba(0,0,0,.74),
        0 0 9px rgba(238,199,100,.075) !important;
      box-shadow:
        0 13px 27px rgba(0,0,0,.46),
        0 0 10px rgba(233,195,95,.057),
        inset 0 1px 0 rgba(255,255,255,.18),
        inset 0 -13px 21px rgba(0,0,0,.34) !important;
    }
  `;

  if (document.getElementById("android-v15-style")) return;

  const style = document.createElement("style");
  style.id = "android-v15-style";
  style.textContent = V15_CSS;
  document.head.append(style);
})();
