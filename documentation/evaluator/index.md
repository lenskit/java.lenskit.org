---
title: Evaluator
---

# Using the LensKit Evaluator

> If you're new to the evaluator, you probably want to start with the [Quick
> Start guide](quickstart).

LensKit provides a flexible framework for conducting offline evaluations of
recommenders. Currently, train-test evaluation of recommender prediction
accuracy is supported; in the future, we will be adding additional evaluation
capabilities.

## Warm-up Example

Let's start with an example:

~~~groovy
import org.grouplens.lenskit.knn.item.*
import org.grouplens.lenskit.transform.normalize.*

trainTest {
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

    metric CoveragePredictMetric
    metric RMSEPredictMetric
    metric NDCGPredictMetric

    output "eval-results.csv"
}
~~~

Save this script in the ML-100K directory as `eval.groovy` and run `lenskit-eval` (included in the [LensKit binary distribution](http://lenskit.grouplens.org/downloads/) — not that this is *not* the same as the `lenskit-eval` Maven goal).

This script does a few things:

1.  Splits the MovieLens 100K data set into 5 partitions for cross-validation.
2.  Generates predictions for test user/item pairs using two
    algorithms: personalized mean and item-item CF.
3.  Evaluates these two algorithms with three metric families:
    coverage, RMSE, and nDCG.
4.  Writes the evaluation results to `eval-results.csv`, one row for
    each combination of algorithm and fold.

You can then load `eval-results.csv` into R, Excel, LibreOffice, or your favorite data analysis tool to inspect and plot the algorithm performance.  So let's use R and draw a box plot of the per-user RMSE:

~~~r
library(ggplot2)
library(data.table)
results = data.table(read.csv("eval-results.csv"))
ggplot(results[,list(RMSE=mean(RMSE.ByUser)),by=list(Algorithm,Partition)]) +
    aes(x=Algorithm, y=RMSE) +
    geom_boxplot()
~~~

![Per-user RMSE](eval-rmse.png)

## Walking through the script

To run an evaluation, you need four basic things:

-   Data to evaluate with.
-   Algorithms to evaluate.
-   Metrics to measure their performance.
-   Somewhere to put the output.

In LensKit, the train-test evaluator builds and tests the algorithms on the data, measures their output with the metrics, and writes the results to a file.  The outer block, `trainTest`, tells LensKit that we want to do a train-test evaluation.  There are other commands as well, but we'll get to those later.

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

[org.grouplens.lenskit.eval.metrics.predict]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/eval/metrics/predict/package-summary.html

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

## More about Scripts

The evaluation scripts are actually Groovy scripts, using an embedded domain-specific language (EDSL) for evaluating recommenders provided as a part of the LensKit evaluation framework.  Simple scripts look a lot like sectioned key-value configuration files, but if you have more sophisticated evaluation needs, the full power of Groovy is available.

### Running Scripts

Scripts can be run two ways: with the `lenskit-eval` script in the binary distribution (which invokes the `org.grouplens.lenskit.eval.cli.EvalCLI` class) or with the `run-eval` goal in the LensKit [Maven plugin][].

[Maven plugin]: http://lenskit.grouplens.org/maven-site/lenskit-eval-maven-plugin

`lenskit-eval` is modeled after tools like Make and Ant.  If you give it no arguments, it runs the script `eval.groovy` in the current directory.  You can tell it to run a specific script file with the `-f` command line option.

### Targets

LensKit eval scripts can also define *targets* to allow complex evaluations to be run in a piecewise fashion.  A target is just like a target in other tools like Ant and make: it is a named sequence of tasks to run.  Targets can also depend on other targets.

Here's a rewrite of the script above to use targets:

~~~groovy
import org.grouplens.lenskit.knn.item.*
import org.grouplens.lenskit.baseline.*
import org.grouplens.lenskit.transform.normalize.*

// use the target method to define a target
def ml100k = target("crossfold") {
    crossfold("ml-100k") {
        source csvfile("ml-100k/u.data") {
            delimiter "\t"
            domain {
                minimum 1.0
                maximum 5.0
                precision 1.0
            }
        }
    }
}

target("evaluate") {
    // require the crossfold target to be run first
    // can also require it by name
    requires ml100k

    trainTest("item-item algorithm") {
        dataset ml100k
   
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

        metric CoveragePredictMetric
        metric RMSEPredictMetric
        metric NDCGPredictMetric

        output "eval-results.csv"
    }
}

defaultTarget "evaluate"
~~~

In this version, the actual tasks from before — `trainTest` and `crossfold` — are not run immediately.  They are run when the targets containing them are run.

If you run `lenskit-eval` with no arguments, this script will run as before.  That is because it specifies a default target of `evaluate`.  But you can just crossfold, without the actual recommender evaluation:

    lenskit-eval crossfold

The `requires` directive specifies that the `evaluate` target depends on the `crossfold` target (saved as the variable `ml100k`) must be run first.  You can depend on a target either by name (`crossfold`) or by object; the `target` command returns a target object that can be used for this purpose.  The object can also be used to access the data returned by its last task: this is why `dataset ml100k` works, even though `ml100k` is a target.  Its last task is `crossfold`, which returns a list of data sets, and `dataset ml100k` arranges for these data sets to be configured once the `crossfold` target has been run so its output is available.

## Additional Cross-Folding Options

Crossfolding (the `crossfold` command) is implemented by [CrossfoldTask][].  It supports several additional directives to control its behavior:

[CrossfoldTask]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/eval/data/crossfold/CrossfoldTask.html

[RandomOrder]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/eval/data/crossfold/RandomOrder.html
[TimestampOrder]: http://lenskit.grouplens.org/apidocs/org/grouplens/lenskit/eval/data/crossfold/TimestampOrder.html

- `source`: the input data
- `partitions`: the number of train-test splits to create.
- `holdout N`: hold out *N* items per user.
- `holdoutFraction f`: hold out a fraction *f* of each user's items.
- `order`: specify an ordering for user items prior to holdout. Can be either [RandomOrder][] for random splitting or [TimestampOrder][] for time-based splitting.
- `name`: a name for the data source, used for referring to the task & the default output names. The string parameter to the crossfold directive, if provided, sets the name.
- `train`: a format string taking a single integer specifying the name of the training data output files, e.g. `ml-100k.train.%d.csv`. The default is `name + ".train.%d.csv"`. The format string is applied to the number of the partition.
- `test`: same as `train`, but for the test set.

[TTDataSet]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/eval/data/traintest/TTDataSet.html

The crossfold task, when executed, returns a list of [TTDataSet][]s representing the different train-test partitions.

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

## Dumping graphs

Besides `trainTest`, the LensKit evaluator also supports `dumpGraph` task that writes a GraphViz file diagramming the configuration of an evaluator:

~~~groovy
dumpGraph {
    output "graph.dot"
    algorithm("PersMean") {
        bind ItemScorer to UserMeanItemScorer
        bind (UserMeanBaseline, ItemScorer) to ItemMeanRatingItemScorer
    }
}
~~~

## Further Reading

[EvaluatorInternals]: http://github.com/lenskit/lenskit/wiki/EvaluatorInternals

Read more about how the evaluator works internally in [Evaluator Internals][EvaluatorInternals].
