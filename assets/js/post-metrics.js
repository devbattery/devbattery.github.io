(function () {
  "use strict";

  var config = window.DEV_BLOG_SUPABASE || {};
  var widgets = Array.prototype.slice.call(
    document.querySelectorAll("[data-post-metrics]")
  );

  if (!widgets.length || !config.url || !config.anonKey || !window.supabase) {
    return;
  }

  var client = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  var tableName = config.metricsTable || "dev_blog_metrics";
  var likedStorageKey = "devbattery:liked-posts:v1";
  var likedPosts = readLikedPosts();
  var statusTimers = {};
  var widgetsByPostId = widgets.reduce(function (acc, widget) {
    var postId = widget.getAttribute("data-post-id");
    if (!postId) return acc;
    if (!acc[postId]) acc[postId] = [];
    acc[postId].push(widget);
    return acc;
  }, {});
  var postIds = Object.keys(widgetsByPostId);

  postIds.forEach(function (postId) {
    syncLikedState(postId);
  });

  bindLikeHandlers();
  hydrateMetrics();

  function readLikedPosts() {
    try {
      return JSON.parse(localStorage.getItem(likedStorageKey)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeLikedPosts() {
    localStorage.setItem(likedStorageKey, JSON.stringify(likedPosts));
  }

  function bindLikeHandlers() {
    widgets.forEach(function (widget) {
      var button = widget.querySelector("[data-post-like]");
      if (!button) return;

      button.addEventListener("click", function () {
        var postId = widget.getAttribute("data-post-id");
        if (!postId || button.getAttribute("data-pending") === "true") return;

        if (likedPosts[postId]) {
          setStatus(postId, "이미 이 브라우저에서 좋아요를 눌렀습니다.");
          return;
        }

        button.setAttribute("data-pending", "true");
        setStatus(postId, "좋아요 저장 중.");

        client
          .rpc("increment_post_like", { p_post_id: postId })
          .then(function (response) {
            if (response.error) throw response.error;
            var row = normalizeRpcRow(response.data);
            likedPosts[postId] = true;
            writeLikedPosts();
            renderMetrics(postId, row);
            syncLikedState(postId);
            setStatus(postId, "좋아요 저장 완료.");
          })
          .catch(function () {
            setStatus(postId, "좋아요 저장에 실패했습니다.", true);
          })
          .finally(function () {
            button.removeAttribute("data-pending");
          });
      });
    });
  }

  function hydrateMetrics() {
    var detailPostIds = postIds.filter(function (postId) {
      return widgetsByPostId[postId].some(function (widget) {
        return widget.getAttribute("data-increment-views") === "true";
      });
    });
    var summaryPostIds = postIds.filter(function (postId) {
      return detailPostIds.indexOf(postId) === -1;
    });

    detailPostIds.forEach(function (postId) {
      client
        .rpc("increment_post_view", { p_post_id: postId })
        .then(function (response) {
          if (response.error) throw response.error;
          renderMetrics(postId, normalizeRpcRow(response.data));
        })
        .catch(function () {
          setStatus(postId, "Could not load metrics.");
        });
    });

    if (!summaryPostIds.length) return;

    client
      .from(tableName)
      .select("post_id,likes_count,views_count")
      .in("post_id", summaryPostIds)
      .then(function (response) {
        if (response.error) throw response.error;
        (response.data || []).forEach(function (row) {
          renderMetrics(row.post_id, row);
        });
      })
      .catch(function () {
        summaryPostIds.forEach(function (postId) {
          setStatus(postId, "Could not load metrics.");
        });
      });
  }

  function normalizeRpcRow(data) {
    if (Array.isArray(data)) return data[0] || {};
    return data || {};
  }

  function renderMetrics(postId, row) {
    var postWidgets = widgetsByPostId[postId] || [];
    var likesCount = Number(row.likes_count || 0).toLocaleString();
    var viewsCount = Number(row.views_count || 0).toLocaleString();

    postWidgets.forEach(function (widget) {
      var likesEl = widget.querySelector("[data-post-likes]");
      var viewsEl = widget.querySelector("[data-post-views]");
      if (likesEl) likesEl.textContent = likesCount;
      if (viewsEl) viewsEl.textContent = viewsCount;
      widget.setAttribute("data-loaded", "true");
    });
  }

  function syncLikedState(postId) {
    var isLiked = Boolean(likedPosts[postId]);
    (widgetsByPostId[postId] || []).forEach(function (widget) {
      var button = widget.querySelector("[data-post-like]");
      if (!button) return;
      button.classList.toggle("is-liked", isLiked);
      button.setAttribute("aria-pressed", isLiked ? "true" : "false");
      button.setAttribute(
        "aria-label",
        isLiked ? "이미 좋아요를 누른 글" : "이 글 좋아요"
      );
      button.title = isLiked ? "이미 좋아요를 누른 글" : "이 글 좋아요";
    });
  }

  function setStatus(postId, message, persist) {
    if (statusTimers[postId]) {
      clearTimeout(statusTimers[postId]);
      delete statusTimers[postId];
    }

    (widgetsByPostId[postId] || []).forEach(function (widget) {
      var status = widget.querySelector("[data-post-metrics-status]");
      if (status) status.textContent = message;
    });

    if (!persist && message) {
      statusTimers[postId] = setTimeout(function () {
        (widgetsByPostId[postId] || []).forEach(function (widget) {
          var status = widget.querySelector("[data-post-metrics-status]");
          if (status) status.textContent = "";
        });
        delete statusTimers[postId];
      }, 2400);
    }
  }
})();
