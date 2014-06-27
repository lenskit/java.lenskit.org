---
title: Release Notes
layout: default
sidenav: rel-nav.html
---

# LensKit Releases

<ul>
{% for rel in site.lenskit.releases %}
<li><a href="/releases/lenskit-{{rel}}.html">Release {{rel}}
  {% if rel == site.lenskit.next %}(in progress)
  {% elsif rel == site.lenskit.version %}(latest)
  {% endif %}
</a>
{% endfor %}
</ul>
