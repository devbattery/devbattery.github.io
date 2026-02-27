(function () {
  "use strict";

  var THEME_STORAGE_KEY = "theme";
  var root = document.documentElement;
  var defaultTheme = document.getElementById("theme-default-css");
  var darkTheme = document.getElementById("theme-dark-css");
  var toggleThemeBtn = document.getElementById("toggle-theme");

  if (!defaultTheme || !darkTheme) {
    return;
  }

  function normalizeTheme(value) {
    return value === "dark" || value === "default" ? value : null;
  }

  function readCookie(name) {
    var escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
    var match = document.cookie.match(
      new RegExp("(?:^|; )" + escaped + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function writeCookie(name, value, maxAgeSeconds) {
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; path=/; max-age=" +
      maxAgeSeconds +
      "; SameSite=Lax";
  }

  function readStorage(storage) {
    if (!storage) {
      return null;
    }

    try {
      return storage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(storage, value) {
    if (!storage) {
      return;
    }

    try {
      storage.setItem(THEME_STORAGE_KEY, value);
    } catch (error) {
      // Ignore storage restrictions and rely on other persistence channels.
    }
  }

  function readThemePreference() {
    return (
      normalizeTheme(readStorage(window.localStorage)) ||
      normalizeTheme(readStorage(window.sessionStorage)) ||
      normalizeTheme(readCookie(THEME_STORAGE_KEY))
    );
  }

  function writeThemePreference(theme) {
    var normalizedTheme = normalizeTheme(theme);

    if (!normalizedTheme) {
      return;
    }

    writeStorage(window.localStorage, normalizedTheme);
    writeStorage(window.sessionStorage, normalizedTheme);
    writeCookie(THEME_STORAGE_KEY, normalizedTheme, 60 * 60 * 24 * 365);
  }

  function getSystemDarkModePreference() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function getInitialTheme() {
    var savedTheme = readThemePreference();

    if (savedTheme === "dark") {
      return "dark";
    }

    if (savedTheme === "default") {
      return "default";
    }

    return getSystemDarkModePreference() ? "dark" : "default";
  }

  function syncGiscusTheme(theme) {
    var giscusFrame = document.querySelector("iframe.giscus-frame");

    if (!giscusFrame || !giscusFrame.contentWindow) {
      return;
    }

    giscusFrame.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: theme === "dark" ? "dark" : "light",
          },
        },
      },
      "https://giscus.app"
    );
  }

  function renderToggleButton(theme) {
    if (!toggleThemeBtn) {
      return;
    }

    var isDarkMode = theme === "dark";
    var nextActionLabel = isDarkMode
      ? "Switch to light mode"
      : "Switch to dark mode";
    var iconClass = isDarkMode
      ? "fa-solid fa-fw fa-moon"
      : "fa-solid fa-fw fa-sun";

    toggleThemeBtn.setAttribute("aria-label", nextActionLabel);
    toggleThemeBtn.setAttribute("title", nextActionLabel);
    toggleThemeBtn.setAttribute("aria-pressed", isDarkMode ? "true" : "false");
    toggleThemeBtn.innerHTML =
      '<i class="' +
      iconClass +
      '" aria-hidden="true"></i><span class="visually-hidden">' +
      nextActionLabel +
      "</span>";
  }

  function applyTheme(theme, persistPreference) {
    var isDarkMode = theme === "dark";

    defaultTheme.media = isDarkMode ? "not all" : "all";
    darkTheme.media = isDarkMode ? "all" : "not all";
    defaultTheme.disabled = isDarkMode;
    darkTheme.disabled = !isDarkMode;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = isDarkMode ? "dark" : "light";
    renderToggleButton(theme);
    syncGiscusTheme(theme);

    if (persistPreference) {
      writeThemePreference(theme);
    }
  }

  var mediaQueryList = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  var initialTheme = getInitialTheme();

  applyTheme(initialTheme, false);

  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener("click", function () {
      var currentTheme = root.getAttribute("data-theme") === "dark" ? "dark" : "default";
      var nextTheme = currentTheme === "dark" ? "default" : "dark";
      applyTheme(nextTheme, true);
    });
  }

  if (mediaQueryList) {
    var syncWithSystem = function (event) {
      if (readThemePreference() !== null) {
        return;
      }

      applyTheme(event.matches ? "dark" : "default", false);
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", syncWithSystem);
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(syncWithSystem);
    }
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== "https://giscus.app") {
      return;
    }

    syncGiscusTheme(root.getAttribute("data-theme") || "default");
  });

  window.addEventListener("pageshow", function () {
    applyTheme(getInitialTheme(), false);
  });
})();
