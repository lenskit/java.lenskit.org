---
title: Release 2.0.4
version: 2.0.4
milestone: 26
layout: release
---

This is a bugfix release in the 2.0 series.

Highlights:

-   Added a *query* set to train-test data sets.  The event DAO from
    this data source is bound to `(@QueryData, EventDAO)` by the
    evaluator if it is present.  Defaults to unset (so the training
    data set will be used).

-   Mark mean-centering normalizer as shareable.

