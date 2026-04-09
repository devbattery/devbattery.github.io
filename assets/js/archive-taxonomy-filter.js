(function () {
  "use strict";

  function normalizeText(value) {
    return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function initTaxonomyFilter(browser) {
    var input = browser.querySelector("[data-taxonomy-filter]");
    var sections = Array.prototype.slice.call(
      browser.querySelectorAll("[data-taxonomy-section]")
    );
    var indexItems = Array.prototype.slice.call(
      browser.querySelectorAll("[data-taxonomy-item]")
    );
    var emptyState = browser.querySelector("[data-taxonomy-empty]");

    if (!input || !sections.length) {
      return;
    }

    function applyFilter() {
      var query = normalizeText(input.value);
      var visibleCount = 0;

      sections.forEach(function (section) {
        var title = section.querySelector(".archive__subtitle");
        var label = normalizeText(title ? title.textContent : "");
        var matches = query === "" || label.indexOf(query) !== -1;

        section.hidden = !matches;

        if (matches) {
          visibleCount += 1;
        }
      });

      indexItems.forEach(function (item) {
        var labelNode = item.querySelector("strong");
        var label = normalizeText(labelNode ? labelNode.textContent : item.textContent);
        var matches = query === "" || label.indexOf(query) !== -1;

        item.hidden = !matches;
      });

      if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      }
    }

    input.addEventListener("input", applyFilter);
    applyFilter();
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-taxonomy-browser]"),
      initTaxonomyFilter
    );
  });
})();
