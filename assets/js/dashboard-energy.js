(function () {
  "use strict";

  var percentKey = "dev_battery_percentage";
  var levelKey = "dev_author_level";
  var awardsKey = "dev_battery_awards";
  var percent = readNumber(percentKey, 78);
  var level = Math.max(1, readNumber(levelKey, 1));
  var awards = readObject(awardsKey);
  var buttons = Array.prototype.slice.call(
    document.querySelectorAll("[data-dashboard-charge]")
  );

  sync();
  exposeApi();
  bindSearchReward();
  bindReadingReward();

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

  function readObject(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage may be blocked; the visual state can still update for this page.
    }
  }

  function writeNumber(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      // Storage may be blocked; the visual state can still update for this page.
    }
  }

  function exposeApi() {
    window.DevBatteryEnergy = {
      award: award,
      charge: charge,
    };
  }

  function award(amount, key) {
    if (key && awards[key]) return false;
    if (key) {
      awards[key] = true;
      writeObject(awardsKey, awards);
    }
    charge(amount);
    return true;
  }

  function charge(amount) {
    percent += amount;
    if (percent >= 100) {
      level += 1;
      percent = percent - 100;
    }
    sync();
  }

  function bindSearchReward() {
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".search__toggle")) return;
      award(2, "search:" + todayKey());
    });
  }

  function bindReadingReward() {
    var detailWidget = document.querySelector(
      "[data-post-metrics][data-increment-views='true']"
    );
    if (!detailWidget) return;

    var postId = detailWidget.getAttribute("data-post-id");
    if (!postId) return;

    var rewardKey = "read:" + postId;
    if (awards[rewardKey]) return;

    var onScroll = function () {
      var scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      var progress = window.scrollY / scrollable;
      if (progress < 0.6) return;

      award(12, rewardKey);
      window.removeEventListener("scroll", onScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
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
