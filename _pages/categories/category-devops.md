---
title: "DevOps"
layout: category
permalink: /devops/
author_profile: true
taxonomy: DevOps
sidebar:
  nav: "categories"
---

{% assign posts = site.categories.devops %}
{% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}
