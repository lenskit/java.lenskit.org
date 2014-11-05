---
title: Documentation
layout: default
sidenav: doc-nav.html
priority: 1
---

# LensKit Documentation

[wiki]: https://github.com/grouplens/lenskit/wiki/

If you're just getting started with LensKit, start with the following:

- [Getting Started](basis/getting-started/), to use LensKit in a project
- [Experiment Quickstart](evaluator/quickstart/), to run recommender experiments with LensKit

Then you will probably want to read the rest of our documentation:

- [LensKit Basics](basics/) — how to use LensKit and work with its interfaces and data structures.
- [LensKit Algorithms](algorithms/) — more detailed discussions of the algorithms LensKit provides.
- [The LensKit Evaluator](evaluator/) — evaluating recommendation quality.
- [Java API documentation](/apidocs/) for the current version
  ({{site.data.lenskit.version}})
- [Versioning policy](versioning/)
- The [LensKit wiki](http://github.com/lenskit/lenskit/wiki) has documentation
  on developing LensKit

Additionally, Chapter 3 of [Michael Ekstrand's
dissertation](http://elehack.net/research/thesis/) describes the design of
LensKit's, along with the motivations behind many of the design decisions.  It
is recommended reading for people wanting to work on the LensKit code.

## Prerelease Documentation

LensKit is under continual development, so the documentation for the latest release may not be up-to-date with the latest developments in the LensKit source tree.  If you are using a prerelease milestone, tracking the latest `master` sources, or working on LensKit itself, we have some additional documentation:

{%if site.data.lenskit.prerelease%}- [JavaDoc for {{site.lenskit.prerelease}}](/next/apidocs/), leading up to {{site.lenskit.next}}{%endif%}
- [JavaDoc for current dev tree](/master/apidocs/) (built from the `master` branch by our continuous integration builds)
