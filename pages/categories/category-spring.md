---
title: "Spring"
layout: category
permalink: /spring/
author_profile: true
taxonomy: Spring
sidebar:
  nav: "categories"
---

{% assign posts = site.categories.spring %}
{% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}