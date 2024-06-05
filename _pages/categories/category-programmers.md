---
title: "Programmers"
layout: category
permalink: /programmers/
author_profile: true
taxonomy: Programmers
sidebar:
  nav: "categories"
---

{% assign posts = site.categories.programmers %}
{% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}