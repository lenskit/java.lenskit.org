---
title: Release 2.0.5
version: 2.0.5
milestone: 28
layout: release
---

This is a minor enhancement release in the 2.0 series.


-   Add `.o.g.l.indexes` to `lenskit-data-structures` to maintain indexes, replacing the
    old `Index` and `Indexer` classes.

-   Clean up some of the evaluator's logging output.

-   Run train-test tasks on the main thread when thread count is 1.

