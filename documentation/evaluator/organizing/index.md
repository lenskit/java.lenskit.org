---
title: Organizing an Evaluation Project
---

# Organizing an Evaluation Project

In the previous two sections, we described how to write an evaluation script and run it using the
LensKit command-line tools.  This is fine for simple experiments.  However, it is not a very
convenient way to manage more complicated experiments that involve multiple tasks and custom
recommender code.

Therefore, we recommend using [Gradle][] to control your LensKit evaluations.  We have provided
a Gradle plugin to make this easier.

You can find a complete example of a Gradle-based experiment in the [eval-quickstart][qs] repository
on GitHub.

[qs]: https://github.com/lenskit/eval-quickstart
[Gradle]: http://gradle.org

<aside class="alert-box info" markdown="1">
Previously, there was a Maven plugin for controlling these evaluations.  The Maven plugin is no
longer supported as of LensKit 2.2.
</aside>

<aside class="alert-box info" markdown="1">
In LensKit 3, the evaluator will be even more closely integrated with Gradle.  See [Upgrading](../upgrading/) for more details of what's coming.
</aside>

## Getting Started

To get started, just clone the [eval-quickstart][qs] repository, or download its sources as a zip
file.  It includes a wrapper script that downloads and runs Gradle for you.

You can copy and modify this code and use it as a template to create your own project.

## Layout of the Project

A Gradle-based experiment has several files and directories:

`build.gradle`
:   This file controls the entire build and evaluation process.

`eval.groovy`
:   The control script for the LensKit evaluator.

`src/main/java`
:   This directory contains the Java sources for your custom recommender components, just like in
    standard Gradle and Maven projects.

`src/test/java`
:   This directory contains the Java tests for your custom components.

`build`
:   This directory is created by the Gradle build process and contains your compiled class files
    and the evaluator's output.

You usually will also have some data; our example downloads the MovieLens 100K data set into
the directory `build/ml-100k`.

## Running the Experiment

To run the experiment, run:

    $ ./gradlew evaluate

If you are on Windows:

    C:\Users\michael\Documents\Experiments\eval-quickstart> gradlew evaluate

You can also import the project as a Gradle project into IntelliJ or Eclipse and run it from there.

## Analyzing the Output

In this experiment, we have provided an IPython notebook that will read the evaluator output and
plot the recommender's accuracy metrics.  If you don't yet have a Python scientific environment
set up, you can install [Anaconda Python][conda] to get all the packages you need.

[conda]: https://www.continuum.io/downloads

To view the notebook, run:

    ipython notebook

This will open a browser, and you can select the `analyze-output.ipynb` notebook.

You can also use Gradle to render the notebook to a static HTML file, `build/analysis.html`:

    ./gradlew analyzeResults

## Understanding the Build Script

The heart of the build script is the `evaluate` task, that runs the LensKit evaluator:

~~~groovy
task evaluate(type: LenskitEval, group: 'evaluate') {
    description 'Runs the LensKit evaluation.'
    dependsOn classes                           // perform java compilation before running this
    dependsOn fetchData                         // download data before evaluating
    script 'eval.groovy'                        // configure the name of the lenskit eval

    inputs.dir fetchData.dataDir
    outputs.files "$buildDir/eval-results.csv", "$buildDir/eval-user.csv"

    classpath sourceSets.main.runtimeClasspath  // use the code we have here, plus its deps
}
~~~

This will run the `eval.groovy` script; it has some additional bookkeeping to tell Gradle how to
integrate it with the other tasks in the file.

## Modifying the Experiment

Once you have everything running, you can modify it to run your own experiment.  There are several
things you may want to modify:

-   Change the experiment setup in `eval.groovy` (see the [walkthrough](../walkthrough/) for more on
    this).
-   Use a different data set, by changing `eval.groovy` (you'll also want to delete the `fetchData`
    task from `build.gradle`, and remove all `dependsOn` references to it)
-   Write more recommender code of your own, in `src/main/java`, and use it in the `eval.groovy`
    experiment.
-   Write additional pre- or post-processing steps for recommender input data or evaluation results,
    and orchestrate them with new Gradle tasks.
