---
layout: none
---

var idx = lunr(function () {
  this.field('title')
  this.field('excerpt')
  this.field('categories')
  this.field('tags')
  this.ref('id')

  this.pipeline.remove(lunr.trimmer)

  for (var item in store) {
    this.add({
      title: store[item].title,
      excerpt: store[item].excerpt,
      categories: store[item].categories,
      tags: store[item].tags,
      id: item
    })
  }
});

$(document).ready(function() {
  function getMaxResults() {
    return window.matchMedia('(max-width: 767px)').matches ? 5 : 10;
  }

  function renderResultsFound(total, shown) {
    var message = total + ' {{ site.data.ui-text[site.locale].results_found | default: "Result(s) found" }}';

    if (total > shown) {
      message += ' · Showing top ' + shown;
    }

    return '<p class="results__found">' + message + '</p>';
  }

  function renderSearchMeta(items, modifier) {
    if (!items || !items.length) {
      return '';
    }

    return items.slice(0, 2).map(function (item) {
      return '<span class="db-search-result__chip ' + modifier + '">' + item + '</span>';
    }).join('');
  }

  function renderSearchItem(item) {
    var hasTeaser = Boolean(item.teaser);
    var teaser = hasTeaser
      ? '<div class="db-search-result__media"><img src="' + item.teaser + '" alt=""></div>'
      : '';
    var cardClass = hasTeaser
      ? 'db-search-result db-search-result--with-media'
      : 'db-search-result db-search-result--text-only';
    var categories = renderSearchMeta(item.categories, 'db-search-result__chip--category');
    var tags = renderSearchMeta(item.tags, 'db-search-result__chip--tag');
    var excerptWords = item.excerpt ? item.excerpt.split(/\s+/).filter(Boolean) : [];
    var excerpt = excerptWords.slice(0, 24).join(' ');

    if (excerptWords.length > 24) {
      excerpt += '...';
    }

    var excerptMarkup = excerpt
      ? '<p class="db-search-result__excerpt" itemprop="description">' + excerpt + '</p>'
      : '';

    return (
      '<article class="' + cardClass + '" itemscope itemtype="https://schema.org/CreativeWork">' +
        teaser +
        '<div class="db-search-result__body">' +
          '<div class="db-search-result__meta">' +
            categories +
            tags +
          '</div>' +
          '<h3 class="db-search-result__title" itemprop="headline">' +
            '<a href="' + item.url + '" rel="permalink">' + item.title + '</a>' +
          '</h3>' +
          excerptMarkup +
        '</div>' +
      '</article>'
    );
  }

  function handleSearchInput() {
    var resultdiv = $('#results');
    var query = $(this).val().toLowerCase();
    var maxResults = getMaxResults();
    var result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          q.term(term, { boost: 100 })
          if(query.lastIndexOf(" ") != query.length-1){
            q.term(term, {  usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          if (term != ""){
            q.term(term, {  usePipeline: false, editDistance: 1, boost: 1 })
          }
        })
      });
    resultdiv.empty();
    if (query.trim() === '') {
      resultdiv.append('<div class="db-search-empty"><p>Start typing to see matching posts, tags, and categories.</p></div>');
      return;
    }
    if (result.length === 0) {
      resultdiv.append('<div class="db-search-empty"><p>No matching posts found. Try another keyword.</p></div>');
      return;
    }

    var visibleResults = result.slice(0, maxResults);
    resultdiv.append(renderResultsFound(result.length, visibleResults.length));

    for (var item in visibleResults) {
      var ref = visibleResults[item].ref;
      resultdiv.append(renderSearchItem(store[ref]));
    }
  }

  $('input#search').on('input', handleSearchInput);
});
