---
title: Release 3.0
version: 3.0
milestone: 3.0
snapshot: true
layout: release
---

LensKit 3.0 is the upcoming major release of LensKit.  This release will not be backwards-compatible with LensKit 2.2.  These release notes are not exhaustive, but are intended to provide a general guide to the changes to look for.  As 3.0's final release nears, we will be writing additional documentation on translating and updating experiments and other migration concerns.

## Organization Changes

-   LensKit code has been moved from `org.grouplens.lenskit` to `org.lenskit`.
-   The LensKit Data Structures module is being removed in favor of fewer custom data structures.  The custom data structures still in use are in the LensKit Core.

## New Public APIs

The LensKit public APIs (`ItemScorer`, `RatingPredictor`, etc.) have been redesigned with new data structures for reporting results.

## Algorithm Changes

-   FunkSVD no longer supports predict-time updating. This logic was not well-tested and always disabled in recommended configurations; this release completely removes it.  We hope to re-introduce it in a better-designed and more configurable manner later.

-   If FunkSVD cannot find an item vector for an item, it now declines to score that item rather than returning the baseline score.  Baseline scores can be added with a fallback item scorer.

-   The quantized rating predictor has moved to `lenskit-predict`.

-   The rating predictor no longer takes a baseline scorer to use as a fallback when the item scorer cannot produce scores, to reduce duplication of logic with the fallback item scorer.  The default behavior is still the same, however, as it uses a `@PredictionScorer` qualifier whose default implementation is `FallbackItemScorer`.
