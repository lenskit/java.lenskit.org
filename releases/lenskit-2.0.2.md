---
title: Release 2.0.2
version: 2.0.2
milestone: 21
layout: release
---

This is the second bugfix release in the 2.0 series.

-   Fix null pointer exception when scoring for nonexistent users (#issue(363)).

-   Fix zombie thread keeping evaluator from terminating (#issue(360)).

-   Improve error reporting when `eval.groovy` is missing (#issue(352)).

-   Improve `CSVDataSource` documentation (#issue(364)).

-   Added `forUser(long)` method to `History` to make it easy to create empty
    user histories.

-   Resolved inconsistency between docs and code for `SparseVector.immutable()` (#issue(368)).
