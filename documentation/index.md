---
title: Documentation
layout: default
sidenav: doc-nav.html
---

# LensKit Documentation

[wiki]: https://github.com/grouplens/lenskit/wiki/

We have prepared several resources to help you learn to use LensKit:

- [Getting Started](http://github.com/grouplens/lenskit/wiki/GettingStarted)
- The [manual](http://github.com/grouplens/lenskit/wiki/Manual) is
  a directory of help pages on the wiki.
- [Java API documentation](/apidocs/) for the current version ({{site.lenskit.version}}).

We also have a [versioning policy](versioning).

## Prerelease Documentation

LensKit is under continual development, so the documentation for the latest release may not be up-to-date with the latest developments in the LensKit source tree.  If you are using a prerelease milestone, tracking the latest `master` sources, or working on LensKit itself, we have some additional documentation:

{%if site.lenskit.prerelease%}
- [JavaDoc for {{site.lenskit.prerelease}}](/next/apidocs/), leading up to {{site.lenskit.next}}
{%endif%}
- [JavaDoc for current dev tree](/master/apidocs/) (built from the `master` branch by our continuous integration builds)
