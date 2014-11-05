---
title: Release Notes
layout: default
sidenav: rel-nav.html
changefreq: weekly
---

# LensKit Releases

<ul>
{% for rel in site.data.lenskit.releases %}
<li><a href="/releases/lenskit-{{rel}}.html">Release {{rel}}
  {% if rel == site.data.lenskit.next %}(in progress)
  {% elsif rel == site.data.lenskit.version %}(latest)
  {% endif %}
</a>
{% endfor %}
</ul>
