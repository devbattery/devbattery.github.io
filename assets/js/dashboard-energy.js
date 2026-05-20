(function () {
  "use strict";

  var percentKey = "dev_battery_percentage";
  var levelKey = "dev_author_level";
  var percent = readNumber(percentKey, 78);
  var level = Math.max(1, readNumber(levelKey, 1));
  var buttons = Array.prototype.slice.call(
    document.querySelectorAll("[data-dashboard-charge]")
  );

  sync();

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      charge(Number(button.getAttribute("data-dashboard-charge")) || 10);
    });
  });

  function readNumber(key, fallback) {
    try {
      var value = Number(localStorage.getItem(key));
      return Number.isFinite(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeNumber(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      // Storage may be blocked; the visual state can still update for this page.
    }
  }

  function charge(amount) {
    percent += amount;
    if (percent >= 100) {
      level += 1;
      percent = percent - 100;
    }
    sync();
  }

  function sync() {
    percent = Math.max(0, Math.min(100, percent));
    level = Math.max(1, level);
    writeNumber(percentKey, percent);
    writeNumber(levelKey, level);

    setText("[data-dashboard-battery-text]", percent + "%");
    setText("[data-dashboard-level]", level);
    setStyle("[data-dashboard-battery-fill]", "width", percent + "%");
  }

  function setText(selector, value) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (node) {
      node.textContent = value;
    });
  }

  function setStyle(selector, property, value) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (node) {
      node.style[property] = value;
    });
  }
})();
