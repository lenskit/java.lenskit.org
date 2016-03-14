---
title: Advanced Evaluator Scripting
prev: metrics
---

# Advanced Evaluator Scripting

<aside class="alert-box warning" markdown="1">
**Note**: This functionality is deprecated and will be replaced with Gradle plugins in LensKit 3.0.
</aside>

The evaluation scripts are actually Groovy scripts, using an embedded
domain-specific language (EDSL) for evaluating recommenders provided as a part
of the LensKit evaluation framework.  Simple scripts look a lot like sectioned
key-value configuration files, but if you have more sophisticated evaluation
needs, the full power of Groovy is available.

## Running Scripts

Scripts are run with the `lenskit eval` command from the LensKit command line
interface.  It can also be run from tools like Gradle and Ant with the
`org.grouplens.lenskit.cli.Main` class.

`lenskit eval` is modeled after tools like Make and Ant.  If you give it no
arguments, it runs the script `eval.groovy` in the current directory.  You can
tell it to run a specific script file with the `-f` command line option.

## Targets

LensKit eval scripts can also define *targets* to allow complex evaluations to be run in a piecewise fashion.  A target is just like a target in other tools like Ant and make: it is a named sequence of tasks to run.  Targets can also depend on other targets.

Here's a rewrite of the [example script](../quickstart/) to use targets:

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
