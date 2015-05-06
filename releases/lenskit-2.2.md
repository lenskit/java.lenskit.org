---
title: Release 2.2
version: 2.2
milestone: 2.2
snapshot: true
layout: release
---

## General Changes

- Fast iteration is now a no-op, and some algorithms have been refactored to maintain performance.

## Algorithms

[KnownRatingRatingPredictor]: http://lenskit.org/master/apidocs/org/grouplens/lenskit/predict/KnownRatingRatingPredictor.html

- Add [KnownRatingRatingPredictor][], a rating predictor that just returns the
  user's existing ratings
  ([#563](https://github.com/lenskit/lenskit/issues/563)).

- The item-item CF implementation's model representation has been changed to be more efficient without fast iteration.

## Data Access

[ItemNameDAO]: /master/apidocs/org/grouplens/lenskit/data/dao/ItemNameDAO.html
[TextEventDAO]: /master/apidocs/org/grouplens/lenskit/data/text/TextEventDAO.html
[ml-format]: /master/apidocs/org/grouplens/lenskit/data/text/Formats.html#movieLensLatest()

- Added [ItemNameDAO][] to provide a standard means of presenting names or
  short descriptions of items, along with a memory-backed implementation and a
  provider to read it from a file.

- Added support to [TextEventDAO][] for skipping header lines.  The number of
  header lines to skip are specified by the `EventFormat`;
  `DelimitedColumnEventFormat` has a setter to specify to skip some header
  lines (e.g. 1 line for a CSV file with headers).

- Added pre-defined format [`Formats.movieLensFormat()`][ml-format] for the [new MovieLens
  data sets][ML20M].

- The `Like` and `LikeBatch` event types provide a standard type for unary and count data in LensKit.

[ML20M]: http://grouplens.org/new-movielens-datasets-released/

## Command Line

- Added `global-recommend` command to do global (non-personalized)
  recommendation with reference items.

- The `recommend`, `global-recommend`, and `predict` commands use the
  `ItemNameDAO`, if available, to print item names (e.g. movie titles).

- The `recommend`, `global-recommend`, and `predict` commands accept a
  `--item-names` command to specify a CSV file mapping item IDs to item names.

- Fixed configuration loading to properly handle custom classpaths.

- The `--help` output is now more thorough.

## Evaluator

[SimpleEvaluator]: /apidocs/org/grouplens/lenskit/eval/traintest/SimpleEvaluator.html

-   **Incompatible change:** the default holdout for `addDataset` methods on
    [SimpleEvaluator][] is now the same as the default on `CrossfoldTask`
    (fixed holdout of 10, instead of the 20% previously used).  This change was
    made to make `SimpleEvaluator` and `CrossfoldTask` have consistent
    defaults.

-   Fixed a bug in the component cache that caused the recommender build to be
    deferred to test time, making timings irrelevant, if the component cache
    was disabled (an important piece of making timings relevant).  Fixed in [PR
    692](https://github.com/lenskit/lenskit/pull/629).

-   Outputting recommendations and predictions is now handled by the `recommendations` and `predictions` metrics, rather than the old `predictFile` and related settings.  This allows the recommendation output to be configured (candidate items, exclude set, and # of items to recommend).

-   Added a Mean Average Precision (MAP) metric (`topNMAP`).

-   Fixed broken top-*N* metric files.

## Advanced Features

-   `LenskitRecommenderEngine` now has a `getComponent()` method to allow a component to be extracted from the model without needing to first create a recommender object.
