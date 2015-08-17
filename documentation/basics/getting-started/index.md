---
title: Getting Started
---

# Getting Started with LensKit

This page describes how to embed LensKit in an application.

[lenskit-hello]: http://github.com/lenskit/lenskit-hello

The [lenskit-hello][] project provides a working example of configuring, building, and using a recommender.  This document is based on that code.

## Getting LensKit

We recommend getting LensKit from the Maven central repositories.  To
do this in a Maven project, add the following to the `<dependencies>`
section of your application's `pom.xml`:

~~~xml
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <artifactId>lenskit-all</artifactId>
  <version>{{site.data.lenskit.version}}</version>
</dependency>
~~~

`lenskit-all` will pull in all of LensKit except the command line interface.  You can instead depend on the particular pieces of LensKit that you need, if you want.  But `lenskit-all` is a good way to get started.

You can also retrieve LensKit from Maven using Gradle, SBT, Ivy, or any other Maven-compatible dependency resolver.  If you don't want to let your build system manage your dependencies, download the [binary distribution](http://lenskit.org/download.html) and put the JARs in your project's library directory.

## Configuring the Recommender

[LenskitConfiguration]: http://lenskit.org/apidocs/org/grouplens/lenskit/core/LenskitConfiguration.html

In order to use LensKit, you first need to configure the LensKit algorithm you want to use.  This consists primarily of selecting the component implementations you want and configuring them with a [LenskitConfiguration][].  For example, to configure a basic item-item kNN recommender with baseline:

~~~java
LenskitConfiguration config = new LenskitConfiguration()
// Use item-item CF to score items
config.bind(ItemScorer.class)
      .to(ItemItemScorer.class);
// let's use personalized mean rating as the baseline/fallback predictor.
// 2-step process:
// First, use the user mean rating as the baseline scorer
config.bind(BaselineScorer.class, ItemScorer.class)
      .to(UserMeanItemScorer.class);
// Second, use the item mean rating as the base for user means
config.bind(UserMeanBaseline.class, ItemScorer.class)
      .to(ItemMeanRatingItemScorer.class);
// and normalize ratings by baseline prior to computing similarities
config.bind(UserVectorNormalizer.class)
      .to(BaselineSubtractingUserVectorNormalizer.class);
~~~

## Connecting the Data Source

LensKit also requires a data source.  To keep things simple, we'll just use a CSV file:

~~~java
config.bind(EventDAO.class).to(new SimpleFileRatingDAO(new File("ratings.csv"), ","));
~~~

## Creating the Recommender

You then need to create a recommender to actually be able to recommend:

~~~java
LenskitRecommender rec = LenskitRecommender.create(config);
~~~

## Generating Recommendations

The recommender object provides access to components like `ItemRecommender` that can do the actual recommendation.  For example, to generate 10 recommendations for user 42:

~~~java
ItemRecommender irec = rec.getItemRecommender();
List<ScoredId> recommendations = irec.recommend(42, 10);
~~~

Since we did not configure an `ItemRecommender` when configuring LensKit, it uses the default: the `TopNItemRecommender`, which scores items using the configured `ItemScorer` and returns the *N* highest-scored items.  Since we are using item-item CF, these scores are the raw predicted ratings from item-item collaborative filtering.

You can also also predict ratings with the `RatingPredictor`:

~~~java
RatingPredictor pred = rec.getRatingPredictor();
double score = pred.predict(42, 17);
~~~

## More Reading

- [Configuring LensKit](../configuration/)
- [How LensKit recommenders are structured](../structure/)
- [Connecting to data sources](../data-access/)
- [How to run an algorithm experiment](../../evaluator/quickstart/)
