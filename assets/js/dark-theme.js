(function () {
  "use strict";

  var root = document.documentElement;
  var defaultTheme = document.getElementById("theme-default-css");
  var darkTheme = document.getElementById("theme-dark-css");
  var toggleThemeBtn = document.getElementById("toggle-theme");

  if (!defaultTheme || !darkTheme) {
    return;
  }

  function readThemePreference() {
    try {
      return localStorage.getItem("theme");
    } catch (error) {
      return null;
    }
  }

  function writeThemePreference(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      // Ignore private mode/storage restrictions and keep runtime-only state.
    }
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

    defaultTheme.disabled = isDarkMode;
    darkTheme.disabled = !isDarkMode;
    root.setAttribute("data-theme", theme);
    renderToggleButton(theme);
    syncGiscusTheme(theme);

    if (persistPreference) {
      writeThemePreference(theme);
    }
  }

  var mediaQueryList = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  var initialTheme = root.getAttribute("data-theme") || getInitialTheme();

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
})();
