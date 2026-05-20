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
  renderMomentumCalendar();
  bindMomentumTooltips();

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

  function bindMomentumTooltips() {
    var cells = Array.prototype.slice.call(
      document.querySelectorAll("[data-momentum-cell]")
    );
    if (!cells.length) return;

    var tooltip = document.createElement("div");
    tooltip.className = "db-momentum-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.appendChild(tooltip);

    cells.forEach(function (cell) {
      cell.addEventListener("mouseenter", function () {
        showMomentumTooltip(cell, tooltip);
      });
      cell.addEventListener("focus", function () {
        showMomentumTooltip(cell, tooltip);
      });
      cell.addEventListener("mousemove", function () {
        positionMomentumTooltip(cell, tooltip);
      });
      cell.addEventListener("mouseleave", function () {
        hideMomentumTooltip(tooltip);
      });
      cell.addEventListener("blur", function () {
        hideMomentumTooltip(tooltip);
      });
    });
  }

  function renderMomentumCalendar() {
    var dataEl = document.getElementById("db-post-calendar-data");
    var cells = Array.prototype.slice.call(
      document.querySelectorAll("[data-momentum-cell]")
    );
    if (!dataEl || !cells.length) return;

    var dates = [];
    try {
      dates = JSON.parse(dataEl.textContent) || [];
    } catch (error) {
      dates = [];
    }

    var countsByDate = dates.reduce(function (acc, date) {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    cells.forEach(function (cell) {
      var date = cell.getAttribute("data-date");
      var dateLabel = cell.getAttribute("data-date-label") || date;
      var count = countsByDate[date] || 0;
      var intensity = getMomentumIntensity(count);
      var countLabel = count === 0 ? "No posts" : count + " post";
      if (count > 1) countLabel += "s";

      cell.classList.remove(
        "db-momentum__cell--0",
        "db-momentum__cell--1",
        "db-momentum__cell--2",
        "db-momentum__cell--3",
        "db-momentum__cell--4"
      );
      cell.classList.add("db-momentum__cell--" + intensity);
      cell.setAttribute("data-post-count", String(count));
      cell.setAttribute("data-tooltip", countLabel + " on " + dateLabel);
      cell.setAttribute("aria-label", countLabel + " on " + dateLabel);
    });
  }

  function getMomentumIntensity(count) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  function showMomentumTooltip(cell, tooltip) {
    tooltip.textContent = cell.getAttribute("data-tooltip") || "";
    positionMomentumTooltip(cell, tooltip);
    tooltip.classList.add("is-visible");
  }

  function hideMomentumTooltip(tooltip) {
    tooltip.classList.remove("is-visible");
  }

  function positionMomentumTooltip(cell, tooltip) {
    var rect = cell.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top - tooltip.offsetHeight - 8;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
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
