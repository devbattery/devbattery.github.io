(function () {
  "use strict";

  var nav = document.querySelector("nav.greedy-nav");
  var toggleButton = nav ? nav.querySelector(".greedy-nav__toggle") : null;
  var hiddenLinks = nav ? nav.querySelector(".hidden-links") : null;

  if (!nav || !toggleButton || !hiddenLinks) {
    return;
  }

  var hiddenLabel = toggleButton.querySelector(".visually-hidden");
  var openLabel =
    toggleButton.getAttribute("data-menu-open-label") || "Open navigation menu";
  var closeLabel =
    toggleButton.getAttribute("data-menu-close-label") || "Close navigation menu";

  function isMenuOpen() {
    return (
      !toggleButton.classList.contains("hidden") &&
      !hiddenLinks.classList.contains("hidden")
    );
  }

  function updateMenuA11yState() {
    var open = isMenuOpen();
    var activeLabel = open ? closeLabel : openLabel;

    toggleButton.setAttribute("aria-expanded", open ? "true" : "false");
    toggleButton.setAttribute("aria-label", activeLabel);
    toggleButton.setAttribute("title", activeLabel);
    hiddenLinks.setAttribute("aria-hidden", open ? "false" : "true");

    if (hiddenLabel) {
      hiddenLabel.textContent = activeLabel;
    }
  }

  function closeMenu() {
    if (!isMenuOpen()) {
      return;
    }

    hiddenLinks.classList.add("hidden");
    toggleButton.classList.remove("close");
    updateMenuA11yState();
  }

  toggleButton.addEventListener("click", function () {
    window.requestAnimationFrame(updateMenuA11yState);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }

    if (isMenuOpen()) {
      closeMenu();
      toggleButton.focus();
    }
  });

  document.addEventListener("click", function (event) {
    if (!isMenuOpen()) {
      return;
    }

    if (nav.contains(event.target)) {
      return;
    }

    closeMenu();
  });

  var stateObserver = new MutationObserver(updateMenuA11yState);
  stateObserver.observe(toggleButton, {
    attributes: true,
    attributeFilter: ["class"],
  });
  stateObserver.observe(hiddenLinks, {
    attributes: true,
    attributeFilter: ["class"],
  });

  updateMenuA11yState();
})();
