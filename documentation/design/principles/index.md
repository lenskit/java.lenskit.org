---
title: LensKit Design Principles
---

We want LensKit to be useful to developers and researchers, enabling them to easily build and research recommender systems.
More specifically, we have designed LensKit to be useful for building production-quality recommender systems in small- to medium-scale environments and to support many forms of recommender research, including research on algorithms, evaluation techniques, and user experience.

We also want LensKit to be useful in educational environments.
As students learn how to build and integrate recommender systems, it can be beneficial for them to use and study existing implementations and not just implement simplified versions of the algorithms.
We have used it ourselves to teach a MOOC and graduate course on recommender systems.
However, the design and implementation been driven primarily by research and system-building considerations, and we have significant work to do in building documentation, simplified APIs, and other entry points to make it more accessible to students.

## Principles

In order to turn LensKit from a concept into working code, we have needed to turn the overall project goals of supporting research and development into software architecture and finally implementations.
LensKit's design and implementation are driven by a few key design principles, many of which are applications of good general software engineering practice:

### Build algorithms from loosely-coupled components.

\citet{herlocker_empirical_2002} separates the user-user collaborative filtering algorithm into several conceptual pieces and considers the potential design and implementation decisions for each separately.
We extend this principle into all our algorithm implementations: a typical recommender is composed of a dozen or more distinct components.

This decoupling achieves several important goals.
First, it is good software engineering practice to separate complicated logic into distinct components that communicate via small, well-defined interfaces in order to improve maintainability, readability, and testability.
An entire collaborative filtering algorithm is difficult to extensively test; item similarity functions and mean-centering normalizers can be tested with relative ease, increasing our confidence in the final system.

Second, it provides extension and configuration points to customize algorithms and experiment with variants.
Breaking the algorithm into small components is a prerequisite for allowing those components to be individually replaced and reconfigured.
For example, \citet{sarwar_item-based_2001} tested different item similarity functions for item-based collaborative filtering; by implementing item similarity as a distinct component in LensKit, we can conduct similar research by providing alternate implementations of the `ItemSimilarity` interface.

Third, it allows components to be re-used between algorithms.
For instance, many algorithms benefit from normalizing user rating data prior to performing more sophisticated computations.
Having distinct `UserVectorNormalizer` components allows us to reuse the same data normalization code across multiple algorithms.

We want researchers to be able to experiment with new algorithms or variances, evaluation metrics, etc., with a minimum of new code.
Ideally, they should only need to write the code necessary to implement the particular idea they wish to try, and be able to reuse LensKit's existing code for everything else.
Composing recommenders from small, replaceable building blocks is how we attempt to achieve this goal.

### Be correct and safe, then efficient.

When designing components of LensKit, we naturally strive first for correct code.
We also seek to design components so that the natural way to use them is likely to be correct, and so that it is difficult to violate their invariants.
One result of this is extensive use of immutable objects, reducing the number of ways in which one component can break another.

To be useful, however, LensKit must also be efficient, and we have continually looked for ways to improve the efficiency of our data structures and algorithms.
We also occasionally provide means, such as fast iteration (\cref{sec:lenskit:fast-iter}), for two components to negotiate a relaxation of certain assumptions in order to improve efficiency.

### Use composition and the Strategy pattern, not inheritance.

Modern object-oriented programming wisdom often recommends against using inheritance as a primary means of extending and configuration code.
Instead, extension points should be exposed as separate components defined by interfaces.
The Strategy pattern \citep{gamma_strategy_1995} is the foundation for this type of software design; under this scheme, if there are different ways a class could perform some portion of its responsibilities, it depends on another component with an interface that encapsulates just the reconfigurable computation instead of using virtual methods that a subclass might override.
There are many benefits to this approach, two of which have significant impact on LensKit:

-   Component implementations can be refactored without breaking code that configures them, so long as the strategy interface is preserved.
-   It is easier to support multiple configuration points.
    If we had a `UserUserCF` class that had virtual methods for normalizing data and comparing users, configuring it would require subclassing and overriding both methods, either implementing the relevant computations or delegating to some other code that does.
    Composition and the Strategy pattern mean that the data normalization and user comparison algorithms can be configured by giving the user-user collaborative filter particular `UserVectorNormalizer` and `UserSimilarity` implementations, which are also provided by LensKit.

### Be configurable, but have sensible defaults.

We want LensKit algorithms — and other aspects of LensKit where appropriate — to be extensively configurable, but we do not want users to have to configure (and therefore understand) every detail in order to start using LensKit.
Therefore, we have broken each algorithm into many individually-configurable components (as described earlier), and continue to refactor the algorithm implementations to support more diverse configurations, but provide default component implementations and parameter values wherever sensible.

Wherever there is a sensible default, and subject to compatibility concerns, we want LensKit's default, out-of-the-box behavior to be current best practices.
This is particularly true for the evaluator, where we want the result of saying ‘evaluate these algorithms’ to be consistent with commonly-accepted evaluation practice.
LensKit's defaults will be evolving — with appropriate versioning and compatibility notices — as the research community comes to greater consensus on how to best conduct evaluations.

### Minimize assumptions.

We attempt to make as few assumptions as possible about the kinds of data users will want to use LensKit with, the types of algorithms they will implement, etc.
This is particularly true for low-level portions of the system, such as the data access layer; relaxing the assumptions of other aspects, such as the evaluator and various algorithm implementations, is an ongoing project.

LensKit's design has been heavily influenced by the principles in *Effective Java* \citep{bloch_effective_2008} in pursuing safe, flexible, maintainable code.

We chose Java for the implementation language and platform for LensKit for two primary reasons.
First, we wanted to write it in a language that would be accessible to a wide range programmers and researchers, particularly students; Java is widely taught and has a high-quality implementation for all common operating systems.
Second, we needed a platform that provides good performance.
With some care in algorithm and data structure design and coding practices, the Java virtual machine provides excellent runtime performance.

## Code Organization

\begin{figure}[tbh]
\includegraphics[width=5.5in]{modules}
\caption{LensKit modules and their relationships}
\label{fig:lk:modules}
\end{figure}

The LensKit code is divided into several modules, reflecting its design to provide lightweight common APIs and a rich support infrastructure for its algorithms, evaluators, and tools.
\Cref{fig:lk:modules} shows the dependency relationships between these modules.

\begin{description}
\item[API]
  The API module contains the interfaces comprising LensKit's recommendation API.
  It contains interfaces for generating recommendation lists, estimating preference, and other high-level recommendation tasks.
  These interfaces are independent of the rest of LensKit (except the data structures library), so that code can be written against them and used with either LensKit's implementations or shims to expose the same interface from another toolkit such as Apache Mahout.
  \Cref{sec:lenskit:apis} describes these APIs in more detail.
\item[Data Structures]
  The data structures module contains several core data structures and data-related utilities used by the reset of LensKit.
  \Cref{sec:lenskit:data-structures} describes these data structures.
\item[Core]
  The core module contains the bulk of LensKit's except for the evaluator and algorithm implementations.
  It provides the support infrastructure for accessing and managing data and configuring recommender implementations, as well as baseline and default recommender components and utility classes used by the rest of LensKit.
\item[Evaluator]
  This module contains the LensKit evaluation tools, providing support for offline estimates of algorithm performance using widely used metrics and evaluation setups.
  \Cref{sec:lenskit:evaluator} describes the evaluator.
\item[Predictors]
  More sophisticated rating prediction support.  This includes OrdRec \citep{koren_ordrec:_2011} and adapters for additional rating prediction.
\item[k-NN]
  Nearest-neighbor collaborative filtering, both user-based \citep{resnick_grouplens:_1994} and item-based \citep{sarwar_item-based_2001} algorithms.
\item[SVD]
  Collaborative filtering by matrix factorization; currently, the only algorithm implemented is FunkSVD \citep{funk_netflix_2006, paterek_improving_2007}.
\item[Slope1]
  Slope One predictors for collaborative filtering \citep{lemire_slope_2005}.
\item[Grapht]
  Grapht, described in more detail in \cref{sec:grapht}, is not technically a part of LensKit.
  It is the dependency injection library used by the LensKit core to configure and instantiate particular recommender algorithms.
\item[CLI]
  The command line interface provides tools for running LensKit evaluations, inspecting algorithm configurations, manipulating data files, etc.
\end{description}
