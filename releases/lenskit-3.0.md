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
-   The LensKit Maven group has moved from `org.grouplens.lenskit` to `org.lenskit`.
-   The LensKit Data Structures module is being removed in favor of fewer custom data structures.  The custom data structures still in use are in the LensKit Core.
-   We have [standardized our `Builder` and `Provider` language](https://github.com/lenskit/lenskit/issues/552).  Components that build other components in the recommender build process are called `Provider`s, and the term `Builder` is reserved for classes that are used to programmatically assemble other objects.

## New Public APIs

The LensKit public APIs (`ItemScorer`, `RatingPredictor`, etc.) have been redesigned with new data structures for reporting results.

## New Data Access Layer

LensKit's Data Access Layer has been completely rewritten to make it easier to link to many
different of data sources.  Documentation is forthcoming.

## Algorithm Changes

-   FunkSVD no longer supports predict-time updating. This logic was not well-tested and always disabled in recommended configurations; this release completely removes it.  We hope to re-introduce it in a better-designed and more configurable manner later.

-   If FunkSVD cannot find an item vector for an item, it now declines to score that item rather than returning the baseline score.  Baseline scores can be added with a fallback item scorer.

-   The quantized rating predictor has moved to `lenskit-predict`.

-   The rating predictor no longer takes a baseline scorer to use as a fallback when the item scorer cannot produce scores, to reduce duplication of logic with the fallback item scorer.  The default behavior is still the same, however, as it uses a `@PredictionScorer` qualifier whose default implementation is `FallbackItemScorer`.

## Evaluator Changes

‘Evaluation scripts’ have gone away in favor of discrete command line tools (`train-test`,
`crossfold`) and a Gradle plugin for scripting them.  This means we can leverage all of Gradle's
engineering in developing a DSL for task automation.

### Metric Changes

- **Incompatible Change**: The Precision and Recall metrics now count users for whom no recommendations could be generated as having precision and recall of 0 in the global average.
- The `MRR.OfGood` variant has gone away, there is now just `MRR`.
