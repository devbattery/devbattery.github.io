---
title: "FastAPI"
layout: category
permalink: /fastapi/
author_profile: true
taxonomy: FastAPI
sidebar:
  nav: "categories"
---

{% assign posts = site.categories.fastapi %}
{% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}