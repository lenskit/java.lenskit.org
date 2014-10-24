---
title: Evaluator Data Processing
---

# Data Processing in the Evaluator

## Additional Cross-Folding Options

Crossfolding (the `crossfold` command) is implemented by [CrossfoldTask][].  It supports several additional directives to control its behavior:

[CrossfoldTask]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/data/crossfold/CrossfoldTask.html

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

[TTDataSet]: http://lenskit.org/apidocs/org/grouplens/lenskit/eval/data/traintest/TTDataSet.html

The crossfold task, when executed, returns a list of [TTDataSet][]s representing the different train-test partitions.

