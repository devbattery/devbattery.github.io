(function () {
  "use strict";

  function initTopNavEnhancements() {
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
  }

  function initFollowMenuEnhancements() {
    var wrappers = Array.prototype.slice.call(
      document.querySelectorAll(".sidebar .author__urls-wrapper")
    );

    if (!wrappers.length) {
      return;
    }

    if (window.jQuery) {
      window.jQuery(".author__urls-wrapper button").off("click");
    }

    var mobileMedia = window.matchMedia
      ? window.matchMedia("(max-width: 1023px)")
      : { matches: true };
    var items = [];

    wrappers.forEach(function (wrapper, index) {
      var button = wrapper.querySelector("button");
      var list = wrapper.querySelector(".author__urls");

      if (!button || !list) {
        return;
      }

      if (!list.id) {
        list.id = "author-follow-links-" + String(index + 1);
      }

      button.type = "button";
      button.setAttribute("aria-haspopup", "true");
      button.setAttribute("aria-controls", list.id);

      items.push({
        wrapper: wrapper,
        button: button,
        list: list,
      });
    });

    if (!items.length) {
      return;
    }

    function isDropdownMode() {
      return mobileMedia.matches;
    }

    function setItemState(item, open) {
      item.button.classList.toggle("open", open);
      item.list.classList.toggle("is--visible", open);
      item.button.setAttribute("aria-expanded", open ? "true" : "false");
      item.list.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function closeAll(except) {
      items.forEach(function (item) {
        if (except && item === except) {
          return;
        }

        setItemState(item, false);
      });
    }

    function syncByViewport() {
      if (isDropdownMode()) {
        closeAll(null);
        return;
      }

      items.forEach(function (item) {
        item.button.classList.remove("open");
        item.button.setAttribute("aria-expanded", "false");
        item.list.classList.remove("is--visible");
        item.list.setAttribute("aria-hidden", "false");
      });
    }

    items.forEach(function (item) {
      item.button.addEventListener("click", function (event) {
        if (!isDropdownMode()) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        var open = !item.list.classList.contains("is--visible");
        closeAll(item);
        setItemState(item, open);
      });
    });

    document.addEventListener("click", function (event) {
      if (!isDropdownMode()) {
        return;
      }

      var clickedInside = items.some(function (item) {
        return item.wrapper.contains(event.target);
      });

      if (!clickedInside) {
        closeAll(null);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !isDropdownMode()) {
        return;
      }

      var active = items.find(function (item) {
        return item.list.classList.contains("is--visible");
      });

      if (!active) {
        return;
      }

      closeAll(null);
      active.button.focus();
    });

    if (mobileMedia.addEventListener) {
      mobileMedia.addEventListener("change", syncByViewport);
    } else if (mobileMedia.addListener) {
      mobileMedia.addListener(syncByViewport);
    }

    syncByViewport();
  }

  initTopNavEnhancements();
  initFollowMenuEnhancements();
})();
