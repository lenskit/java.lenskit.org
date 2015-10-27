---
title: Updating Experiments
---

# Updating Experiments

LensKit 3.0 overhauls the way that we configure and run experiments.  This page describes how to
update your LensKit 2.x experiments to work in LensKit 3.

You can find an example using the new structure in the [lk3 branch of eval-quickstart][qs].

[qs]: https://github.com/lenskit/eval-quickstart/tree/lk3

{% include upcoming.md version="3.0" %}

## Overview and Motivation

In LensKit 2, evaluations were configured and run via `eval.groovy` scripts written in a custom domain-specific language built on top of Groovy.  These scripts took care of data preparation, running recommenders, and had some rudimentary build system capabilities to handle different tasks.

There were several problems with this:

- We were implementing a build tool, and not doing nearly so good a job of it as Gradle or Ant.
- The ins and outs of the script language were not documented and were somewhat prone to breakage.
- It was difficult to extend, and even harder to document how to extend it.

For LensKit 3, we have rebuilt the evaluator's various capabilities into command-line tools and
written a more complete Gradle plugin to allow them to be configured and run.  Now, rather than
having a single `LenskitEval` task in your `build.gradle`, you define separate `Crossfold` and `TrainTest` tasks, and can mix them up with whatever other Gradle tasks you can imagine (including doing other things with the output of the crossfolder).

The Gradle tasks, and the *Spec* objects that they use to communicate with the evaluator, are
documented in the [Gradle plugin API docs](/master/gradle-docs/).

## Setting Up

LensKit 3 evaluations are driven by `build.gradle` rather than `eval.groovy`.  If you were using
Gradle to run evaluations before, you can edit your existing Gradle file; if you were using the old
Maven plugin or some other tool, you'll need to convert to Gradle.

You first need to tell Gradle where to get the LensKit plugin.  We don't yet publish it to the
Gradle plugin repository (although we plan to at release time), so add the following to the top of
your `build.gradle`:

~~~groovy
buildscript {
    repositories {
        maven {
            url 'https://oss.sonatype.org/content/repositories/snapshots/'
        }
        mavenCentral()
    }
    dependencies {
        classpath 'org.grouplens.lenskit:lenskit-gradle:3.0-SNAPSHOT'
    }
}
~~~

Next, we need to activate the plugin and import its tasks:

~~~groovy
apply plugin: 'java' // if you use Groovy or Scala, add those plugins
apply plugin: 'lenskit'

import org.lenskit.gradle.*
~~~

And then set up the project dependencies to pull in LensKit:

~~~
repositories {
    maven {
        url 'https://oss.sonatype.org/content/repositories/snapshots/'
    }
    mavenCentral()
}

dependencies {
    compile "org.grouplens.lenskit:lenskit-all:3.0-SNAPSHOT"
    runtime "org.grouplens.lenskit:lenskit-cli:3.0-SNAPSHOT"
}
~~~

There's a little redundancy here between the `buildscript` block and `repositories`; currently,
Gradle doesn't let us remove that.

## Converting Crossfolding

Now that we have the main infrastructure ready, we can set up the data.  We do this via a
`Crossfold` task; this like the `crossfold` task in the old LensKit evaluator.

~~~groovy
task crossfold(type: Crossfold, group: 'evaluate') {
    input textFile {
        file "data/ml-100k/u.data"
        delimiter "\t"
        // ratings are on a 1-5 scale
        domain {
            minimum 1.0
            maximum 5.0
            precision 1.0
        }
    }
    // test on random 1/5 of each user's ratings
    userPartitionMethod holdoutFraction(0.2, 'random')
    // use 5-fold cross-validation
    partitionCount 5
    // pack data for efficiency
    outputFormat 'PACK'
}
~~~

The Gradle tasks configure *spec* objects that describe the evaluation to run.  The tasks provide
some helper methods, such as `input`, `textFile`, and `holdoutFraction`, to make it easier to build
many kinds of specs; other methods, such as `partitionCount`, delegate directly to the spec's
JavaBean property methods.

Anything in one of the `spec` classes that cannot be successfully configured in a Gradle task is
a bug.

## Converting Train-Test Evaluation

Once you have created a crossfold task, you can use it to run a train-test experiment:

~~~groovy
task evaluate(type: TrainTest, group: 'evaluate') {
    // we add our crossfold task as evaluation input
    dataSet crossfold

    // send the output to appropriate files
    outputFile "$buildDir/eval-results.csv"
    userOutputFile "$buildDir/eval-users.csv"

    // configure our algorithms
    algorithm 'PersMean', 'algorithms/pers-mean.groovy'
    algorithm 'ItemItem', 'algorithms/item-item.groovy'
    algorithm 'Custom', 'algorithms/custom.groovy'

    // and some evaluation tasks and metrics
    predict {
        metric 'rmse'
        metric 'ndcg'
    }
    recommend {
        metric 'mrr'
    }
}
~~~

Some things are very much like the old code, such as adding the `crossfold` task as a `dataSet` (except that the task cannot be nested in Gradle).  The output file is also there.

There are two important changes to be aware of.

### Algorithm Configuration

Algorithms are now configured in independent Groovy files, using the [configuration
syntax](/documentation/basics/configuration/).  In addition, you can have `algorithm` blocks to
define multiple algorithms in a single Groovy file, just like the old `algorithm` blocks:

~~~groovy
algorithm('FunkSVD') {
    attributes['FeatureCount'] = 100
    // configure your FunkSVD algorithm here
}
~~~

If an algorithm configuration file has *no* `algorithm` blocks, then the entire configuration is
treated as a single algorithm.  If there are one or more `algorithm` blocks, then the algorithms
they define are used and a separate top-level algorithm is *not* created.

### Metrics

Metrics have also changed.  In LensKit 2, you specified metrics by class, or by builder-based
blocks, and just specified metrics for the evaluation.

LensKit 3 introduces the notion of *evaluation tasks*, each of which is a thing to do with a
recommender.  For prediction accuracy (RMSE, etc.), this doesn't really make a practical difference.
For top-*N* evaluations, however, it is a major improvement.  Previously, each top-*N* metric needed
to know the list size and candidate/exclude sets and request recommendations with them; aggressive
caching prevented this from being very slow.  Now, computing the list of recommendations is the job
of the *task*, and the metric just measures the recommendation list that it is given.  The upshot is
that top-*N* metrics are much easier to write.

Enough blabbing.  What does it look like?  Well, for predictions, you write a `predict` block
describing a predict task with its metrics and (optionally) output file:

~~~groovy
predict {
    outputFile "$buildDir/predictions.csv.gz"
    metric 'rmse'
    metric 'ndcg'
}
~~~

This will write all the test predictions to a compressed CSV file, and compute the RMSE and Predict
nDCG of each prediction.

Recommendations operate similarly, but have some additional configuration options:

~~~groovy
recommend {
    listSize 25
    candidateItems "allItems"
    excludeItems "user.trainItems"
    outputFile "$buildDir/recommendations.csv.gz"
    metric 'ndcg'
    metric('mrr') {
        goodItems "user.testItems"
    }
}
~~~

This does a few things:

- Recommend 25 items per user
- Consider all items except those in the user's training set (their past history) to be candidates
- Compute top-*N* nDCG
- Write all recommendations to a compressed CSV file
- Compute mean reciprocal rank, considering all items in the user's test set to be relevant

The item selectors (`candidates`, `exclude`, and `goodItems`) are actually Groovy expressions,
evaluated in the context of an [ItemSelectScript][] so they have access to the set of all items
(`allItems`) and the user being tested (`user`), as well as a few helpful utility functions.  For
example, if you want the candidate set to consist of the user's test items plus 100 random decoys,
you can use the following:

    user.testItems + pickRandom(allItems - user.trainItems, 100)

This is a little complicated, because we want to remove the training items from the universe *before* picking decoys, so we have a full set of 100 decoys after applying the exclude set.

These changes do mean that any metrics you wrote for LensKit 2 will need to be modified to work with
the new metric interfaces for LensKit 3.  There are two base classes, [PredictMetric][] and
[TopNMetric][].  Consult the source code for LensKit's metric implementations, such as
[TopNLengthMetric][], for an example of what a new metric should look like.

[PredictMetric]: /master/apidocs/org/lenskit/eval/traintest/predict/PredictMetric.html
[TopNMetric]: /master/apidocs/org/lenskit/eval/traintest/recommend/TopNMetric.html
[TopNLengthMetric]: https://github.com/lenskit/lenskit/blob/master/lenskit-eval/src/main/java/org/lenskit/eval/traintest/recommend/TopNLengthMetric.java
[ItemSelectScript]: /master/apidocs/org/lenskit/eval/traintest/recommend/ItemSelector.ItemSelectScript.html

## Finishing Up

If you have custom Java code, just put it in the usual `src/main/java` directory, and it will be
compiled before the evaluation is run.  It will also be treated as an input file to the evaluation,
so the evaluation will rerun if your custom code changes.

A few things, such as subsampling, have gone away.  The new, flexible evaluation model based on
smaller pieces that you can recombine at will means that such custom data processing can be
implemented in Python or R scripts that get run by the Gradle build file (using an `Exec`) task.
LensKit development will focus on fundamental and commonly-used recommendation tasks, but if you
have a task you'd like to see us directly support, please raise it on the [mailing list](/connect)
or our [issue tracker](https://github.com/lenskit/lenskit/issues).
