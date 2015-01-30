---
title: Release 2.2
version: 2.2
milestone: 2.2
snapshot: true
layout: release
---

## Algorithms

[KnownRatingRatingPredictor]: http://lenskit.org/master/apidocs/org/grouplens/lenskit/predict/KnownRatingRatingPredictor.html

- Add [KnownRatingRatingPredictor][], a rating predictor that just returns the
  user's existing ratings
  ([#563](https://github.com/lenskit/lenskit/issues/563)).

## Evaluator

[SimpleEvaluator]: /apidocs/org/grouplens/lenskit/eval/traintest/SimpleEvaluator.html

-   **Incompatible change:** the default holdout for `addDataset` methods on
    [SimpleEvaluator][] is now the same as the default on `CrossfoldTask`
    (fixed holdout of 10, instead of the 20% previously used).  This change was
    made to make `SimpleEvaluator` and `CrossfoldTask` have consistent
    defaults.
