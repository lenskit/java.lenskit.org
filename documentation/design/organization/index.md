---
title: Code Organization
---

The LensKit code is divided into several modules, reflecting its design to provide lightweight common APIs and a rich support infrastructure for its algorithms, evaluators, and tools.

\begin{figure}[tbh]
\includegraphics[width=5.5in]{modules}
\caption{LensKit modules and their relationships}
\label{fig:lk:modules}
\end{figure}

API
:   The API module contains the interfaces comprising LensKit's recommendation API.
    It contains interfaces for generating recommendation lists, estimating preference, and other high-level recommendation tasks.
    These interfaces are independent of the rest of LensKit (except the data structures library), so that code can be written against them and used with either LensKit's implementations or shims to expose the same interface from another toolkit such as Apache Mahout.
    [LensKit APIs](../apis/) describes these APIs in more detail.

Core
:   The core module contains the bulk of LensKit's except for the evaluator and algorithm implementations.
    It provides the support infrastructure for accessing and managing data and configuring recommender implementations, as well as baseline and default recommender components and utility classes used by the rest of LensKit.

Evaluator
:   This module contains the LensKit evaluation tools, providing support for offline estimates of algorithm performance using widely used metrics and evaluation setups.
    The [Evaluator section](../evaluator/) describes the evaluator.

Predictors
:   More sophisticated rating prediction support.  This includes OrdRec \citep{koren_ordrec:_2011} and adapters for additional rating prediction.

k-NN
:   Nearest-neighbor collaborative filtering, both user-based \citep{resnick_grouplens:_1994} and item-based \citep{sarwar_item-based_2001} algorithms.

SVD
:   Collaborative filtering by matrix factorization; currently, the only algorithm implemented is FunkSVD \citep{funk_netflix_2006, paterek_improving_2007}.

Slope1
:   Slope One predictors for collaborative filtering \citep{lemire_slope_2005}.

Grapht
:   Grapht, described in more detail in \cref{sec:grapht}, is not technically a part of LensKit.
    It is the dependency injection library used by the LensKit core to configure and instantiate particular recommender algorithms.

CLI
:   The command line interface provides tools for running LensKit evaluations, inspecting algorithm configurations, manipulating data files, etc.

Gradle plugin
:   The Gradle plugin provides LensKit-specific tasks for the [Gradle][gradle] build tool, making it easier to control and script LensKit evaluations.

[gradle]: http://gradle.com
