---
title: Release 2.0.3
version: 2.0.3
milestone: 21
layout: release
---

This is the third bugfix release in the 2.0 series.

-   Fix `TopNItemRecommender` bug when no scores are available (#issue(373)).

-   Fix bug in `retainAll` for long sorted array sets (#issue(379)).

-   Fix erroneous fix for scorer null pointer problems (#issue(363)).

-   Add `MeanCenteringVectorNormalizer` for more efficient mean centering.

-   Improve evaluator error reporting and logging output.

-   Small performance improvements.

-   Initial support for Top-N evaluation (grouplens/lenskit#388).


## Credits

Thanks to @hmf and @ethanl for reporting bugs fixed in this release.
