---
title: Evaluator Metrics
---

# Evaluator Metrics

## Top-N metrics

The metrics discussed above are all prediction accuracy metrics, evaluating the accuracy of the rating predictor either for ranking items or for predicting the user's rating for individual items.  LensKit also supports metrics over recommendation lists; these are called Top-N metrics, though the recommendation list may be generated by some other means.

Configuring a top-N metric is a bit more involved than a prediction accuracy metric.  It requires you to specify a few things:

-   The length of recommendation list to consider
-   The items to consider as candidates for recommendation
-   The items to exclude from recommendation
-   For some metrics, the items considered ‘good’ or ‘bad’

For example, to compute Top-N nDCG of 10-item lists over all items the user has not rated in the training set:

~~~groovy
metric topNnDCG {
    listSize 10
    candidates ItemSelectors.allItems()
    exclude ItemSelectors.trainingItems()
}
~~~

As of LensKit 2.0.3, the following Top-N metrics are available:

-   `topNnDCG` — normalized discounted cumulative gain
-   `topNLength` — actual length of the top-N list (to measure truncated lists due to low coverage)
