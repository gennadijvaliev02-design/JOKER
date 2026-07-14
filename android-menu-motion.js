(() => {
  "use strict";

  /* The CSS fan animation is the single owner. Do not run a second infinite Web Animation. */
  const startScreen = document.getElementById("start-screen");
  const cards = [...document.querySelectorAll(".menu-fan-card")];

  if (!startScreen || !cards.length) return;

  function syncMenuMotion() {
    const shouldRun = !document.hidden && !startScreen.classList.contains("is-hidden");
    cards.forEach((card) => {
      card.style.animationPlayState = shouldRun ? "running" : "paused";
    });
  }

  const observer = new MutationObserver(syncMenuMotion);
  observer.observe(startScreen, { attributes: true, attributeFilter: ["class", "hidden"] });
  document.addEventListener("visibilitychange", syncMenuMotion, { passive: true });
  syncMenuMotion();
})();

(() => {
  "use strict";

  /* Android final UI owner for tasks 4–5: raised hand and rating modal. */
  let installed = false;

  function getLanguage() {
    return window.JokerI18n?.getLanguage?.() || window.JokerLanguage || "ru";
  }

  function installFinalUi() {
    if (installed) return;

    const startScreen = document.getElementById("start-screen");
    const menuActions = document.querySelector(".menu-actions");
    const ratingCard = document.getElementById("local-rating-card");

    if (!startScreen || !menuActions || !ratingCard) return;

    installed = true;
    document.documentElement.dataset.androidUi345 = "true";

    if (!document.getElementById("android-ui-345-style")) {
      const style = document.createElement("style");
      style.id = "android-ui-345-style";
      style.textContent = `
        /* Raise the human hand by roughly 15% of card height on landscape phones. */
        .table > .hand {
          bottom: -16px !important;
        }

        @media (max-height: 420px) {
          .table > .hand {
            bottom: -22px !important;
          }
        }

        /* Rating leaves the cramped menu flow and opens as a focused dialog. */
        .android-rating-button {
          width: 100% !important;
        }

        .android-rating-modal[hidden] {
          display: none !important;
        }

        .android-rating-modal {
          position: absolute;
          inset: 0;
          z-index: 420;
          display: grid;
          place-items: center;
          padding: max(16px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
          contain: layout paint style;
        }

        .android-rating-backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(1, 8, 12, .88);
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .android-rating-dialog {
          position: relative;
          width: min(540px, 78vw);
          max-height: min(84vh, 390px);
          overflow: auto;
          padding: 16px;
          border: 1px solid rgba(226, 194, 111, .46);
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.08), transparent 25%),
            radial-gradient(circle at 12% 0%, rgba(255,226,116,.18), transparent 42%),
            linear-gradient(145deg, rgba(13, 39, 37, .995), rgba(5, 13, 19, 1));
          box-shadow:
            0 26px 68px rgba(0,0,0,.68),
            inset 0 1px 0 rgba(255,255,255,.13);
          transform: translate3d(0, 8px, 0) scale(.985);
          opacity: 0;
          transition: transform 170ms ease-out, opacity 150ms ease-out;
          contain: layout paint style;
        }

        .android-rating-modal.is-open .android-rating-dialog {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
        }

        .android-rating-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 12px;
        }

        .android-rating-title {
          color: #f2d48a;
          font-size: clamp(18px, 2vw, 23px);
          font-weight: 950;
          letter-spacing: .065em;
          text-transform: uppercase;
          text-shadow: 0 2px 4px rgba(0,0,0,.76);
        }

        .android-rating-close {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 12px;
          background: rgba(255,255,255,.07);
          color: #f5fbf8;
          font-size: 24px;
          line-height: 1;
        }

        .android-rating-body .local-rating-card {
          width: 100% !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }

        .android-rating-body .local-rating-stats {
          display: grid !important;
        }

        @media (max-height: 420px) {
          .android-rating-dialog {
            width: min(560px, 82vw);
            max-height: 82vh;
            padding: 12px 14px 14px;
          }

          .android-rating-header {
            margin-bottom: 8px;
          }

          .android-rating-close {
            width: 34px;
            height: 34px;
          }
        }
      `;
      document.head.append(style);
    }

    let ratingButton = document.getElementById("android-rating-button");
    if (!ratingButton) {
      ratingButton = document.createElement("button");
      ratingButton.id = "android-rating-button";
      ratingButton.className = "menu-action android-rating-button";
      ratingButton.type = "button";
      const settingsButton = document.getElementById("settings-button");
      if (settingsButton) {
        settingsButton.insertAdjacentElement("beforebegin", ratingButton);
      } else {
        menuActions.append(ratingButton);
      }
    }

    let modal = document.getElementById("android-rating-modal");
    if (!modal) {
      modal = document.createElement("section");
      modal.id = "android-rating-modal";
      modal.className = "android-rating-modal";
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = `
        <button class="android-rating-backdrop" type="button" aria-label="Закрыть рейтинг"></button>
        <div class="android-rating-dialog" role="dialog" aria-modal="true" aria-labelledby="android-rating-title">
          <div class="android-rating-header">
            <div class="android-rating-title" id="android-rating-title"></div>
            <button class="android-rating-close" type="button" aria-label="Закрыть">×</button>
          </div>
          <div class="android-rating-body"></div>
        </div>
      `;
      startScreen.append(modal);
    }

    const body = modal.querySelector(".android-rating-body");
    if (body && ratingCard.parentElement !== body) {
      body.append(ratingCard);
    }

    const closeButton = modal.querySelector(".android-rating-close");
    const backdrop = modal.querySelector(".android-rating-backdrop");
    const title = modal.querySelector(".android-rating-title");

    function syncLanguage() {
      const isEnglish = getLanguage() === "en";
      ratingButton.textContent = isEnglish ? "🏆 Rating" : "🏆 Рейтинг";
      if (title) title.textContent = isEnglish ? "Rating" : "Рейтинг";
      if (closeButton) closeButton.setAttribute("aria-label", isEnglish ? "Close" : "Закрыть");
      if (backdrop) backdrop.setAttribute("aria-label", isEnglish ? "Close rating" : "Закрыть рейтинг");
      window.JokerRating?.render?.();
    }

    function openRating() {
      syncLanguage();
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => modal.classList.add("is-open"));
      window.setTimeout(() => closeButton?.focus(), 40);
    }

    function closeRating() {
      if (modal.hidden) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      window.setTimeout(() => {
        modal.hidden = true;
        ratingButton.focus();
      }, 180);
    }

    ratingButton.addEventListener("click", openRating);
    closeButton?.addEventListener("click", closeRating);
    backdrop?.addEventListener("click", closeRating);
    document.getElementById("start-game")?.addEventListener("click", closeRating);
    window.addEventListener("joker-language-change", syncLanguage);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeRating();
    });

    syncLanguage();
  }

  installFinalUi();
  window.addEventListener("load", installFinalUi, { once: true });
})();
