---
title: "Operating system"
layout: category
permalink: /operating-system/
author_profile: true
taxonomy: operating-system
sidebar:
  nav: "categories"
---

{% assign posts = site.categories.operating-system %}
{% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}
