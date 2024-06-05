---
title: "Recap"
layout: category
permalink: /recap/
author_profile: true
taxonomy: Recap
sidebar:
  nav: "categories"
---

{% assign posts = site.categories.recap %}
{% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}