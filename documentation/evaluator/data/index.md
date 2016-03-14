---
title: Evaluator Data Processing
prev: organizing
next: metrics
---

# Data Processing in the Evaluator

## Additional Cross-Folding Options

Crossfolding (the `crossfold` command) is implemented by [CrossfoldTask][].  It supports several additional directives to control its behavior:

[CrossfoldTask]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/data/crossfold/CrossfoldTask.html

[RandomOrder]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/data/crossfold/RandomOrder.html
[TimestampOrder]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/data/crossfold/TimestampOrder.html
[CrossfoldMethod]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/data/crossfold/TimestampOrder.html

- `source`: the input data
- `partitions`: the number of train-test splits to create.
- `holdout N`: hold out *N* items per user.
- `retain N`: retain *N* items per user (holding out all other items).
- `holdoutFraction f`: hold out a fraction *f* of each user's items.
- `method`: specify the  [crossfold method][CrossfoldMethod].
- `sampleSize N`: For sampling-based crossfold methods, the size of each sample.
- `order`: specify an ordering for user items prior to holdout. Can be either [RandomOrder][] for random splitting or [TimestampOrder][] for time-based splitting.
- `name`: a name for the data source, used for referring to the task & the default output names. The string parameter to the crossfold directive, if provided, sets the name.
- `train`: a format string taking a single integer specifying the name of the training data output files, e.g. `ml-100k.train.%d.csv`. The default is `name + ".train.%d.csv"`. The format string is applied to the number of the partition.
- `test`: same as `train`, but for the test set.

[TTDataSet]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/data/traintest/TTDataSet.html

The crossfold task, when executed, returns a list of [TTDataSet][]s representing the different train-test partitions.

## Crossfolding Methods

The crossfold task supports three crossfolding methods (see [CrossfoldMethod][]():

- `PARTITION_RATINGS` splits the ratings into *K* partitions, with the test set
  consisting of the ratings in that partition and the train set consisting of
  the remainder of the ratings.
- `PARTITION_USERS` partitions the users into *K* partitions.  For each
  partition, the test set consists of the held out ratings for the users in
  that partition (as specified by `holdout`, `holdoutFraction`, or `retain`
  parameters).  The training set consists of the remaining ratings for those
  users, along with all ratings from the users in other partitions.
- `SAMPLE_USERS` works like `PARTITION_USERS`, except that it produces *K*
  disjoint samples of *M* users each (where *M* is specified by `sampleSize`)
  instead of partitioning all users into disjoint sets.
