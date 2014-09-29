---
title: Common Components
---

# Common LensKit Components

LensKit is organized around *components*, which provide various services related to recommendation. A recommender itself provides many components; [configuring a recommender](../../configuration/) selects the implementations and parameters of the various components.

## Public Components

[Recommender]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/Recommender.html
[org.grouplens.lenskit]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/package-summary.html
[Mahout]: http://mahout.apache.org

Certain components, defined in the `lenskit-api` module, are commonly provided by many recommender configurations and are considered part of LensKit's public API. These components are accessed via the getter methods on the [Recommender][] interface, and are intended to be implementable without the rest of LensKit (e.g. as a shim on top of [Mahout][]).  Full documentation is available in the JavaDoc for the [org.grouplens.lenskit][] package.

[ItemRecommender]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/ItemRecommender.html
[ItemScorer]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/data/pref/PreferenceDomain.html
[PreferenceDomain]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/ItemScorer.html
[SimpleRatingPredictor]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/basic/SimpleRatingPredictor.html
[TopNItemRecommender]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/basic/TopNItemRecommender.html
[RatingPredictor]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/RatingPredictor.html 
[GlobalItemScorer]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/GlobalItemScorer.html
[GlobalRatingPredictor]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/GlobalRatingPredictor.html
[GlobalItemRecommender]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/GlobalItemRecommender.html
[@BaselineScorer]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/baseline/BaselineScorer.html

- An [ItemScorer][] computes user-specific scores for items. These scores represent some concept of relevance or usefulness of the item to the user, with higher scores being more relevant.  The interface itself makes no particular guarantees about the range or interpretation of the scores, other than that higher scores are in some sense better; the specific implementation that is configured may provide additional guarantees.
- A [RatingPredictor][] predicts preferences, in the same scale as the ratings the system collects from users.  This interface is similar to  `ItemScorer`.  The default implementation, [SimpleRatingPredictor][], wraps the item scorer and clamps its scores to the rating range (if one is specified; if no [PreferenceDomain][] is configured, the scores are used unclamped).  The default rating predictor also supports a baseline item scorer, annotated with [@BaselineScorer][], that it consults for items for which the primary item scorer does not return a score.
- An [ItemRecommender][] recommends items for a user.  The default implementation, [TopNItemRecommender], returns the top *N* items as scored by the item scorer.
- The [GlobalItemScorer][] interface is like `ItemScorer`, except it scores items with respect to an item (or set of items) but ''not'' with respect to a user.  It, along with related interfaces [GlobalRatingPredictor][] and [GlobalItemRecommender][], is useful for producing global statistic scores for new users, or for doing “people who bought the items in your shopping cart also bought X, Y, or Z” recommendations.

[Individual algorithms](../../algorithms/) define many of their own internal components.  [Recommender Structure](..) discusses in more detail the relationships of various components to build a full recommender configuration.

## Internal Components

[LenskitRecommender]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/core/LenskitRecommender.html

In addition to the public components, LensKit also provides many other components that are used in the LensKit implementations of the public components. These components can be accessed with the `get` method on [LenskitRecommender][].
