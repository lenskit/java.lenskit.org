---
title: Eval Script Walkthrough
---

# Evaluation Scripts

LensKit evaluations are driven by *evaluator scripts*, which define a set of
operations such as crossfolding a data set an running a train-test evaluation
over it.  By convention, these script files are named `eval.groovy`, but can
pick a different name (and specify it with the `-f` option to `lenskit eval` if
you want to have multiple different evaluations in one directory.

Consider again the evaluation script from the [Quick Start guide](../quickstart/):

{% gist 4f86eb836dc4ed35e995 %}

To run an evaluation, you need four basic things:

-   Data to evaluate with.
-   Algorithms to evaluate.
-   Metrics to measure their performance.
-   Somewhere to put the output.

In LensKit, the train-test evaluator builds and tests the algorithms on the
data, measures their output with the metrics, and writes the results to a file.
The outer block, `trainTest`, tells LensKit that we want to do a train-test
evaluation.  There are other commands as well, but we'll get to those later.

### Input Data

At the beginning of the `trainTest` block, we have the following:

~~~groovy
dataset crossfold("ml-100k") {
    source csvfile("u.data") {
        delimiter "\t"
        domain {
            minimum 1.0
            maximum 5.0
            precision 1.0
        }
    }
}
~~~

This piece of code loads the main ratings file from the data set and prepares it for cross-validation.

The first important piece is `dataset`.  It's a directive provided by `trainTest` that adds a data set to the evaluation.  You can have multiple data sets and evaluate on all of them at once.  In fact, under the hood that is what this is doing, because…

The `crossfold` command takes a data set and partitions it for crossfold validation.  The result is actually *N* separate train-test data sets, one for each fold.  The `crossfold` command returns these data sets, and LensKit sees `dataset` is being invoked with a list of data sets and adds them all to the evaluation.

The crossfolder operates on a data source.  In this case it is a CSV file (actually tab-separated, but LensKit calls all delimited text files CSV files).  The file name is `u.data`, the delimiter is `\t`, and it is on a 1–5 star scale with a precision of 1 star (the `domain` block specifies the domain of ratings).

### Specifying the Algorithms

Next comes a pair of `algorithm` blocks specifying the algorithms to test:

~~~groovy
algorithm("PersMean") {
    bind ItemScorer to UserMeanItemScorer
    bind (UserMeanBaseline, ItemScorer) to ItemMeanRatingItemScorer
}

algorithm("ItemItem") {
    bind ItemScorer to ItemItemScorer
    bind UserVectorNormalizer to BaselineSubtractingUserVectorNormalizer
    within (UserVectorNormalizer) {
        bind (BaselineScorer, ItemScorer) to ItemMeanRatingItemScorer
    }
}
~~~

Each algorithm has a name (‘PersMean’ and ‘ItemItem’).  The [algorithm configuration](../configuration/) is based on the concept of *bindings*: binding component interfaces (e.g. `ItemScorer`) to the desired implementations (e.g. `ItemItemScorer` for item-item collaborative filtering).

The personalized mean (PersMean) algorithm operates by computing user and item average offsets from the global rating.  It implements the prediction rule *p(u,i) = μ + bᵢ + bᵤ*, where *μ* is the global mean rating, *bᵢ* is the difference between the item's mean rating and the glob mean, and *bᵤ* is the mean of the differences between the user's rating for each item and that item's mean.  This is done by using `UserMeanItemScorer`, which scores items using a user average, as the `ItemScorer`, and telling it to use the item mean rating as the offset from which to compute user means (the `UserMeanBaseline`).

The item-item CF algorithm (ItemItem) uses standard item-item collaborative filtering.  This is enabled by choosing `ItemItemScorer` as the item scorer implementation.  It then sets up normalization, normalizing the ratings by subtracting item means prior to computing similarities and scores.  This is done by the `UserVectorNormalizer`, which here is configured to subtract a baseline; the baseline, in turn, is set to the item mean rating.  The default settings are used for the rest of the algorithm's parameters, such as similarity function and neighborhood size.

For more on configuring algorithms, see:

-   [Algorithm Structure](../basics/structure/) (describes the core components common to many algorithms, as well as LensKit baselines)
-   [Configuring LensKit](../basics/configuration/)
-   The documentation for various [algorithm families](../algorithms/)

### Metrics

Next, we set up three metrics:

    metric CoveragePredictMetric
    metric RMSEPredictMetric
    metric NDCGPredictMetric

[org.grouplens.lenskit.eval.metrics.predict]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/metrics/predict/package-summary.html

These metrics are each classes in the [org.grouplens.lenskit.eval.metrics.predict][] package.  The `metric` directive takes either a metric instance or a metric class; it will automatically instantiate the class using its default constructor.

Each metric computes some measurement over the recommender's output and adds it to the evaluation output.  Each metric can produce multiple measurements that will appear in separate columns in the output file.  These metrics produce:

-   `CoveragePredictMetric`: coverage and general counting statistics (you'll usually want to include it).  These include:
    -   `NUsers`, the number of users tested
    -   `NAttempted`, the number of predictions attempted
    -   `NGood`, the number of predictions made
    -   `Coverage`, the fraction of attempted predictions actually made
-   `RMSEPredictMetric`: computes the RMSE of predictions with respect to actual user ratings.  It computes both per-user (`RMSE.ByUser`) and global (`RMSE.ByRating`) RMSE.
-   `NDCGPredictMetric`: Computes the nDCG of the prediction output, ranking items by prediction and computing the normalized discounted cumulative gain of this list using the user's rating as each item's gain.

### Output

Not a whole lot here, just a simple output setting:

    output "eval-results.csv"

This directs the evaluator to write its output to the file `eval-results.csv`.  This file contains the algorithm name, data set (name and partition), the wall clock time used to build and test the recommender, and the aggregate output of each of the metrics.

You can also set two additional output files:

-   `userOutput` will write a file containing metric results for each test user.  Use this if you want to post-process metric results on a user-by-user level.
-   `predictOutput` writes each prediction (and its associated actual rating) to a CSV file.  This allows you to compute your own prediction accuracy metrics externally.

