---
title: "Project"
layout: category
permalink: /project/
author_profile: true
taxonomy: Project
sidebar:
  nav: "categories"
---

{% assign posts = site.categories.project %}
{% for post in posts %} {% include archive-single.html type=page.entries_layout %} {% endfor %}