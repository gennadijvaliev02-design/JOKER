(() => {
  "use strict";

  const V14_CSS = String.raw`
    /* Android V14 — calm Joker announcement polish only. */
    .joker-announcement {
      box-shadow:
        0 18px 42px rgba(0, 0, 0, 0.52),
        0 0 16px rgba(255, 214, 41, 0.12),
        0 0 12px rgba(44, 177, 255, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
    }

    .joker-announcement::before {
      background: linear-gradient(115deg, transparent 0 30%, rgba(255, 255, 255, 0.17) 45%, transparent 60% 100%) !important;
    }

    .joker-announcement.is-take {
      box-shadow:
        0 18px 42px rgba(0, 0, 0, 0.52),
        0 0 16px rgba(72, 255, 154, 0.11),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
    }

    .joker-announcement-player {
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.82),
        0 0 7px rgba(255, 214, 41, 0.15) !important;
    }

    .joker-announcement-suit.is-red {
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.70),
        0 0 10px rgba(255, 66, 66, 0.27) !important;
    }

    .joker-announcement-suit.is-black {
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.80),
        0 0 9px rgba(255, 255, 255, 0.17) !important;
    }

    .player.is-joker-announcer .avatar {
      box-shadow:
        0 0 0 3px rgba(255, 214, 41, 0.72),
        0 0 14px rgba(255, 214, 41, 0.34),
        inset 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
    }

    .player.is-joker-announcer .name {
      text-shadow: 0 0 8px rgba(255, 214, 41, 0.31) !important;
    }
  `;

  if (!document.getElementById("android-v14-style")) {
    const style = document.createElement("style");
    style.id = "android-v14-style";
    style.textContent = V14_CSS;
    document.head.append(style);
  }
})();
