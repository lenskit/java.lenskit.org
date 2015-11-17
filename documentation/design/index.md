---
title: LensKit Design and Implementation
---

LensKit is an open-source software package for building, researching, and learning about recommender systems.
It is intended to support reproducible research on recommender systems and provide a flexible, robust platform for experimenting with different recommendation techniques in a variety of research settings.

This section of the LensKit documentation is adapted from Chapter 3 of Michael Ekstrand's Ph.D dissertation, [*Towards Recommender Engineering*](//md.ekstrandom.net/research/thesis/), and material published in:

<div class="citation" markdown="span">
Michael D. Ekstrand, Michael Ludwig, Joseph A. Konstan,
and John T. Riedl. 2011. <a href="https://elehack.net/research/pubs/lenskit"
class="pub-title">Rethinking The Recommender Research Ecosystem:
Reproducibility, Openness, and LensKit</a>. In <span
class="pub-venue">Proceedings
of the Fifth ACM Conference on Recommender Systems</span> (RecSys ’11). ACM,
New York, NY, USA, 133-140. DOI=<a
href="http://dx.doi.org/10.1145/2043932.2043958">10.1145/2043932.2043958</a>.
</div>

In support of these goals, LensKit provides several key facilities:

-   **Common APIs** for recommendation tasks, such as *recommend* and *predict*, allow researchers and developers to build applications and experiments in an algorithm-agnostic manner.
-   **Implementations of standard algorithms** for recommendation and rating prediction, making it easy to incorporate state-of-the-art recommendation techniques into applications or research.
-   An **evaluation toolkit** to measure recommender performance on common data sets with a variety of metrics.
-   **Extensive support code** to allow developers to build new algorithms, evaluation methodologies, and other extensions with a minimum of new work.
    In particular, LensKit provides infrastructure to help developers write algorithms that integrate easily into both offline evaluation harnesses and live applications using many different types of data sources, and to make these algorithms extensively configurable.

## Introduction to LensKit

The following code demonstrates the basic steps that a program needs to perform in order to use LensKit to generate recommendations:

```java
// Load a recommender configuration (item-item CF)
LenskitConfiguration config = ConfigHelpers.load("item-item.groovy");
// Set up a data source
config.bind(EventDAO.class)
      .to(SimpleFileRatingDAO.create(new File("ratings.csv"), "\t"));

// Create the recommender
Recommender rec = LenskitRecommender.build(config);
ItemRecommender itemRec = rec.getItemRecommender();

// generate 10 recommendations for user 42
List<ScoredId> recommendations = irec.recommend(42, 10);
```

These steps are:

-   Configure the recommender algorithm.
    This is done here by loading the `item-item.groovy` configuration file, which configures an
    item-item collaborative filtering recommender.
    The LensKit documentation contains example configuration files for several different algorithms.

-   Set up a data source; in this case, tab-separated rating data from `ratings.tsv`.

-   Construct the LensKit recommender, represented in the `Recommender` object.
    This provides access to all of the facilities provided by the configured recommender.

-   Get the `ItemRecommender` component, responsible for producing recommendation lists for users,
    and use it to compute 10 recommendations for user 42.

Using and integrating LensKit revolves around a *recommender*.
A LensKit recommender comprises a set of interfaces providing recommendation, rating prediction, and other recommender-related services using one or more recommender algorithms connected to a data source.
These services are exposed via individual interfaces — `ItemRecommender`, `RatingPredictor`, `ItemScorer`, etc. — reflecting different capabilities of the recommender.

Experimenters wanting to use LensKit to compare a set of algorithms can write an evaluation script, specifying three primary things:

-   The data set(s) to use
-   The algorithms to test
-   The metrics to use

This evaluation script that will perform a cross-validation experiment on three algorithms.

```groovy
trainTest {
    dataset crossfold {
        source csvfile("ratings.csv") {
            domain minimum: 1.0, maximum: 5.0, precision: 1.0
        }
    }

    metric CoveragePredictMetric
    metric RMSEPredictMetric
    metric NDCGPredictMetric

    algorithm 'pers-mean.groovy', name: 'PersMean'
    algorithm 'item-item.groovy', name: 'ItemItem'
    algorithm 'user-user.groovy', name: 'UserUser'
}
```

Experiments can be substantially more sophisticated — recording extensive metrics over recommender models and outputs, testing procedurally generated algorithm variants, etc. — but at their core, they are measurements of algorithms over data sets.
The evaluator produces its output in CSV files so it can be analyzed and charted in Excel, R, or whatever the user wishes.

## Recommender APIs
\label{sec:lenskit:apis}

## Data Model
\label{sec:lenskit:data-model}

LensKit recommenders need a means of accessing and representing the data — ratings, purchases, item metadata, etc. — from which they are to compute recommendations.
To support this in a general fashion, extensible to many types of data, LensKit defines the concepts of *users*, *items*, and *events*.
This design is sufficiently flexible to allow LensKit to work with explicit ratings,implicit preference extractable from behavioral data, and other types of information in a unified fashion.

Users and items are represented by numeric identifiers (Java `long`s).
LensKit makes no assumptions about the range or distribution of user and item identifiers, nor does it require users and items to have disjoint sets of identifiers.
The only constraint it places upon the users and items in the data it interacts with is that they can be represented with numeric IDs.

An event is some type of interaction between a user and an item, optionally with a timestamp.
Each type of event is represented by a different Java interface extending `Event`.
Since ratings are such a common type of data for recommender input, we provide a `Rating` event type that represents a user articulating a preference for an item.%
\footnote{LensKit does not yet provide implementations of other event types, but it is one of our high-priority tasks.}
A rating can also have a null preference, representing the user removing their rating for an item.
Multiple ratings can appear for the same user-item pair, as in the case of a system that keeps a user's rating history; in this case, the system must associate timestamps with rating events, so that the most recent rating can be identified.

Recommender components access the user, item, and event data through data access objects (DAOs).
Applications embedding LensKit can implement the DAO interfaces in terms of their underlying data store using whatever technology they wish — raw files, JDBC, Hibernate, MongoDB, or any other data access technology.
LensKit also provides basic implementations of these interfaces that read from delimited text files or generic databases via JDBC, and implement more sophisticated functionality by caching the events in in-memory data structures.

The methods these interfaces define come in two flavors.
Basic data access methods, prefixed with `get` (such as `getEventsForItem(long)`), retrieve data and return it in a standard Java data structure such as a list (or a LensKit-specific extension of such a structure).
Streaming methods, prefixed with `stream`, return a *cursor* of items; cursors allow client code to process objects (usually events) one at a time without reading them all into memory, and release any underlying database or file resource once processing is completed or abandoned.

The standard LensKit DAO interfaces are:

\begin{ClassList}
\item[EventDAO]
  The base DAO interface, providing access to a stream of events.
  Its only methods are to stream all events in the database, optionally sorting them or filtering them by type.
\item[ItemEventDAO]
  An interface providing access to events organized by item.
  With this interface, a component can retrieve the events associated with a particular item, optionally filtering them by type.
  It can also stream all events in the database grouped by item.
\item[UserEventDAO]
  Like `ItemEventDAO`, but organized by user.
\item[ItemDAO]
  An interface providing access to items.
  The base interface provides access to the set of all item IDs in the system.
\item[UserDAO]
  An interface providing access to users.
  Like `ItemDAO`, it provides access to the set of all user IDs in the system.
\end{ClassList}

An application that augments LensKit with components needing additional information, such as user or item metadata for a content-based recommender, will augment these interfaces with additional interfaces (possibly extending the LensKit-provided ones) to provide access to any relevant data.
We have done this ourselves when embedding LensKit in an application or using it for an experiment; for example, in teaching our recommender systems MOOC, we extended `ItemDAO` with methods to get the tags for a movie to allow students to build a tag-based recommender in LensKit.

Early versions of LensKit had a single `DataAccessObject` interface that was handled specially by the configuration infrastructure; it was possible to extend this interface to provide extra data such as tags, but it was not very easy.
Since LensKit 2.0, the data access objects are just components like any others, and receive no special treatment.

## Data Structures
\label{sec:lenskit:data-structures}
\label{sec:lenskit:fast-iter}

LensKit implements several data structures and data-related utilities to support building and working with recommenders.

There are many places where we need to be able to manipulate vectors of values associated with users and items, such as a user rating vector containing the user's current rating for each item they have rated.
To support these uses, LensKit provides a *sparse vector* type.
Sparse vectors are optimized maps from `long`s to `double`s with efficient support for linear algebra operations such as dot products, scaling, and addition.
Initially, we tried using hash maps for these vectors, but they performed poorly for common computations such as vector cosines.

The `SparseVector` class uses parallel arrays of IDs and values, sorted by ID.
This provides memory-efficient storage, efficient ($O(\Lg n)$) lookup by key, and enables many two-vector operations such as dot products to be performed in linear time by iterating over two vectors in parallel.
This class helps LensKit algorithm implementers write many types of algorithms in a concise and efficient manner.
Sparse vectors also provide type-safe immutability with three classes: the abstract base class `SparseVector` provides the base implementation and read-only methods; `ImmutableSparseVector` extends it and guarantees that the vector cannot be changed by any code; and `MutableSparseVector` extends `SparseVector` with mutation operations such as setting or adding individual keys or sets of keys from another vector.

To maintain predictable performance, the sparse vectors do have one key limitation: when created, a sparse vector has a fixed *key domain*, the set of all keys that can possibly be stored in it.
Individual entries can be set or unset, but once a sparse vector (even an immutable one) is created, no entry can be added whose key was not in the original key domain.
This means that sparse vectors never have to reallocate or rearrange memory: getting or setting the value for a key is either $O(\Lg n)$ or fails in all cases.
Programmers using sparse vectors must organize their code to work around this, setting up the list of keys they need in advance
In practice, most code we have written can easily know in advance the set of user or item IDs that it will need to work with and allocate a vector without incurring overhead in either run time or code bloat.
For those cases where the IDs are discovered on-the-fly, we use a more dynamic structure such as a hash map and convert it to a vector when we are finished.

LensKit also provides additional data structures for associating lists of events with user or item IDs, mapping long IDs to contiguous 0-based indexes (helping to store user or item data in arrays), and associating scores with IDs either on their own or in lists (where the sorted-by-key property of sparse vectors is undesired).

In addition to its own data structures, LensKit makes heavy use of fastutil\footnote{\url{http://fastutil.dsi.unimi.it/}} and Google Guava.
The fastutil library provides primitive collections that are compatible with the Java collections API, allowing LensKit to have lists, sets, and maps of unboxed longs and doubles.
We use these extensively throughout the LensKit code to reduce memory consumption and allocation overhead, significant sources of slowdown in naïve Java code.

LensKit also borrows the *fast iteration* pattern from fastutil for its own data structures; under fast iteration, an iterator can mutate and return the same object repeatedly rather than returning a fresh object for each call to its `next()` method.
For classes that present flyweights over some internal storage (e.g. entry objects representing key-value pairs in a sparse vector), this can significantly reduce object allocation overhead.
Reducing needless object allocations has resulted in many significant, measurable performance improvements.
Many LensKit data structures and the `Cursor` API support fast iteration.

## Modular Algorithms
\label{sec:lenskit:mod-algorithms}
\label{sec:lenskit:modular-algorithms}

In order to reproduce a wide variety of previously-studied algorithms and configurations, as well as facilitate easy research on new configurations and tunings of existing recommender algorithms, LensKit uses a heavily modular design for its algorithm implementations.
LensKit also provides configuration facilities built around this design to make it easy to configure, instantiate, and use modular algorithms.

LensKit algorithms are, wherever practical, broken into individual components that perform discrete, isolated portions of the recommendation computation, as discussed in \cref{sec:lenskit:design}.
Similarity functions, data normalization passes, baseline predictors, and neighborhood finders are just some examples of the types of distinct components in LensKit algorithms.
The Strategy pattern \citep{gamma_strategy_1995} provides the basis for the design of many of these components and their interactions.

We also make significant use of builders or factories.
We prefer to create immutable components (or at least visibly immutable objects — some have internal caching mechanisms), and keep components that exist primarily to make data available simple.
To that end, we will make a component that is a data container with well-defined access operations paired with a builder to do the computations needed to build the object.
This keeps the build computations separate from the (relatively simple) access operations, and also allows the build strategy to be replaced with alternative strategies that produce the same type of data object.

Together, the modularity and separation strategies LensKit employs provide two significant benefits:

\begin{itemize}
\item
  Algorithms can be customized and extended by reimplementing just the components that need to be changed.
  For example, if a researcher wishes to experiment with alternative strategies for searching for neighbors in user-based collaborative filtering, they only need to reimplement the neighborhood finder component and can reuse the rest of the user-based CF implementation.
\item
  New algorithms can be built with less work by reusing the pieces of existing algorithms.
  A new algorithmic idea that depends on item similarity functions and a transposed (item-major) rating matrix can reuse those components from the item-item CF implementation.
\end{itemize}

LensKit algorithms also make significant use of other common design patterns, such as Builder and Facade, to organize algorithm logic \citep{gamma_design_1995}.

To enable components to be configurable, LensKit components are designed using the *dependency injection* pattern \citep{martin_dependency_1996}.
The idea of dependency injection is that a component requires the code that instantiates it to provide the objects on which it depends rather than instantiating them directly.
With this design, the caller can substitute alternate implementations of a component's dependencies and substantially reconfigure its behavior.

Since a LensKit algorithm implementation consists of many interoperating components, instantiating all the objects needed to use one is cumbersome, error-prone, and difficult to keep up-to-date as the code is extended and improved.
LensKit uses an automated dependency injector (Grapht; see \cref{sec:grapht}) to ease this process.
Grapht scans the Java class implementing each component, extracts its dependencies, and instantiates the graph of objects needed to realize a particular recommendation algorithm.
As shown in \cref{lst:example-setup}, the client code just needs to specify what implementation it wants to use for various interfaces, and the values of some parameters, and LensKit will use Grapht to instantiate the objects correctly.
\Cref{fig:lenskit:item-item} shows the full object diagram for LensKit's item-item collaborative filter; the large number of components intricate dependency edges would be impractical to instantiate manually.
LensKit also provides defaults for most of its interfaces and parameters, so users only need to specify configuration points where they wish to deviate from the default.

This results in such things as being able to use item-item collaborative filtering as a baseline for a matrix factorization approach.
We have sought to avoid imposing artificial limits on the ways that components can be combined.

The components in a LensKit algorithm generally divide into two categories: *pre-built* components are built once from the underlying data and can be reused across multiple recommender invocations; they may go a bit stale in a production system, but are usually rebuilt on a schedule (e.g. nightly) to take new data into account.
These components are often statistical models, precomputed matrices, etc.; they are marked with the `@Shareable` annotation to allow LensKit's tooling to recognize and work with them.
*Runtime* components need live access to the data source and are used to directly produce recommendations and predictions.
This distinction is used to aid in web integration (\cref{sec:lenskit:web}) and speed up evaluation (\cref{sec:lenskit:eval-throughput}).

### Basic Component Implementations
\label{sec:lenskit:basic}

LensKit provides basic implementations of several of its core interfaces.
The net effect of these implementations and LensKit's default settings is that the user only needs to configure the item scorer to get a reasonably full-featured recommender that can generate recommendation lists and predict ratings.
They also provide common functionality to enable new recommenders to be written without extensive code duplication.

The `TopNItemRecommender` uses the item scorer to score the candidate items and recommends the top $N$.
It is the default implementation of `ItemScorer`.
By default, it excludes the items that the user has interacted with (e.g. rated), unless the client specifies a different exclude set.

`SimpleRatingPredictor` implements `RatingPredictor` by wrapping an `ItemScorer` and clamping the item scores to be within the range of allowable ratings.
It just does a hard clamp of the values without any other rescaling.
If no rating range is specified, the rating predictor passes through the item scores unmodified.
Integrators can specify rating ranges by configuring a `PreferenceDomain` object.

The simple rating predictor can also use a second item scorer, the *baseline scorer*, specified with the `@BaselineScorer` qualifier.
If a baseline scorer is available, it is used to supply scores for items that the primary scorer cannot score.
Most recommenders are configured to use a full recommendation algorithm as the primary scorer and a simple but always-successful scorer, such as a personalized mean or item average, as the baseline scorer, so the system can always predict ratings.
LensKit also provides a `FallbackItemScorer` that implements the fallback logic as an item scorer instead of a rating predictor; this can be used to allow other components using an item scorer, such as an item recommender, to use the fallback scores.

LensKit also has a `QuantizedRatingPredictor` that rounds the scores produced by an item scorer to the nearest valid rating value (e.g. on a half-star rating scale, it will round them to the nearest 0.5).

### Summarizers and Normalizers
\label{sec:lenskit:summaries}
\label{sec:lenskit:normalize}

Many recommender algorithms have historically operated on the user's rating vector.
Systems that do not use explicit ratings may produce some kind of a vector over items for each user, representing the user's history with or preference for that item, such as a vector of play or purchase counts.
Several algorithms can be adapted to implicit preference data simply by using some vector other than the rating vector, perhaps with small tweaks to the algorithm's computations.

In both implicit and explicit cases, it is also common to normalize the vector in some way, such as mean-centering it normalizing it to $z$-scores.

LensKit exploits this potential for generalizability with *history summarizers*, expressed in the `UserHistorySummarizer` interface.
A history summarizer takes a user's history, expressed as a list of events, and produces a sparse vector whose keys are items and values are some real-valued summary of the user's preference for that item.

The default history summarizer is `RatingVectorUserHistorySummarizer`, which summarizes a user's profile by extracting their most recent rating for each item.
There is also `EventCountUserHistorySummarizer`, which counts the number of times some type of event occurs for each item.
Using this summarizer with an event type `Play`, for example, would count the number of `Play` events associated with each item for that user, resulting in a play count vector.

For convenience, in the remainder of this section, we will use *rating* to refer to the summarized value associated with an item in the user's profile; if we need to distinctly refer to different types of events, we will call them `Rating` events.

As well as summarizers, LensKit provides and uses various *normalizers*.
The most general normalizers are vector normalizers, defined by the `VectorNormalizer` interface.
Vector normalizations operate on two vectors: the *reference* vector and *target* vector.
The reference vector is used to compute the basis of the normalization; for example, `MeanCenteringVectorNormalizer` computes the mean of the reference vector.
The target vector is the vector actually modified.
If they are the same vector, normalization has the effect of e.g. subtracting the mean value from every value in the vector.

To be reversible, vector normalizers also support creating a transformation from a reference vector.
This operation captures the transformation that will be applied, such as the mean value to subtract.
The transformation can then be applied and unapplied to any vector.
\Cref{lst:lenskit:normalize} shows this in action: normalizing user data, computing some output, and then using the original transformation (such as a mean-centering transform using the user's mean rating) to de-normalize the output.

\begin{listing}
  \input{lst/normalize.java}
  \caption{Use of vector normalizers.}
  \label{lst:lenskit:normalize}
\end{listing}

In addition to the generic `VectorNormalizer` interface, LensKit provides user- and item-specific normalizers.
These interfaces function identically to the vector normalizer, including producing vector transformations, except that they take a user or item ID in addition to a reference vector.
This allows normalizations to take into account other information about the user or item; such normalizers often depend on either a DAO to access user or item data, or some other component which may take advantage of knowing the user or item for which a vector should be normalized.
The default implementations of these interfaces ignore the user or item ID and delegate to a `VectorNormalizer`.

### Baseline Scorers
\label{sec:lenskit:baselines}

LensKit provides a suite of *baseline* item scorers, using simple averages to compute scores for items.
These baselines serve multiple roles.
They are often used as fallbacks to predict ratings or compute recommendations when a more sophisticated recommender cannot (e.g. a nearest-neighbor collaborative filter cannot build a neighborhood).
They are also used for data normalization — many standard algorithm configurations apply the sophisticated algorithm to the residual of the baseline scores rather than the raw ratings.
This is done by using the baseline-subtracting user vector normalizer, an implementation of `UserVectorNormalizer` (\cref{sec:lenskit:normalize}) that transforms vectors by subtracting the score produced by a baseline scorer.
This paradigm is an extension of the mean-centering normalization that has long been employed in recommender systems and other data analysis algorithms.
It results in the following final scoring rule \citep{ekstrand_collaborative_2010}, where $b_{ui}$ is the baseline score for user $u$ and item $i$:

\begin{align*}
  \mathrm{score}(u, i) & = b_{ui} + \mathrm{score}'(u, i)
\end{align*}

All baseline scorers implement the `ItemScorer` interface, so they can be used on their own to score items.
This also means that any item scorer can be used as a baseline in another algorithm, a significant aspect of the composability of LensKit algorithms.
LensKit provides the following baseline scorers:

\begin{ClassList}
\item[ConstantItemScorer]
  Scores every item with some pre-defined constant value.

\item[GlobalMeanRatingItemScorer]
  Scores every item with the global mean rating ($b_{ui}= \mu$).

\item[ItemMeanRatingItemScorer]
  Scores every item with its mean rating, so $b_{ui} = \mu_i$.
  This scorer also takes a damping parameter $\gamma$ to bias the computed mean ratings towards the global mean for items with few ratings.
  A small number of ratings is not a good sample of the true quality of that item; this term keeps items from having extreme means without substantial evidence to support such values.
  \Cref{eq:lenskit:baseline:item-mean-off,eq:lenskit:baseline:item-mean} show the full formulas for this scorer, with the set $U_i$ consisting of users who have rated item $i$:

  \begin{align}
    \label{eq:lenskit:baseline:item-mean-off}
    \bar\mu_i & = \frac{\sum_{u \in U_i}(r_{ui} - \mu)}{|U_i| + \gamma} \\
    \label{eq:lenskit:baseline:item-mean}
    b_{ui} & = \mu + \bar\mu_i
  \end{align}

  $\gamma > 0$ is equivalent to assuming *a priori* that every item has $\gamma$ ratings equal to the global mean $\mu$.
  When few users rate the item, it damps the effect of their ratings so that the system does not assume that an item has 5 stars because it has a single 5-star rating.
  As more users rate the item, the real ratings increasingly dominate these fake ratings and the baseline score approaches the simple mean of user ratings for the item.

\item[UserMeanItemScorer]
  This scorer is more sophisticated.
  It depends on another scorer (designated the *user mean baseline*), producing scores $b'_{ui}$, and a user history summarizer that produces a vector $\vec{u}$ of item values for the user (e.g. ratings).
  It computes the mean difference $\hat\mu_u$ between the user's value for each item and the user mean baseline's scores for that item; it scores each item with its baseline score and the user mean offset.
  \Cref{eq:lenskit:baseline:user-mean-off,eq:lenskit:baseline:user-mean} show the formulas for this computation; $\gamma$ is again a damping term, working as it does in the item mean rating scorer, and $I_u$ is the set of items in $\vec{u}$.

  \begin{align}
    \label{eq:lenskit:baseline:user-mean-off}
    \hat\mu_u & = \frac{\sum_{i \in I_u} (u_i - b'_{ui})}{|I_u| + \gamma} \\
    \label{eq:lenskit:baseline:user-mean}
    b_{ui} & = b'_{ui} + \hat\mu_u
  \end{align}

  If the user has no ratings, $\hat\mu_u = 0$, so this scorer's scores fall back to the underlying baseline.
  If the item mean rating scorer is used as the user mean baseline and user profiles are summarized by rating vectors, then $\hat\mu_u$ is the user's average deviance from item average rating and $b_{ui} = \mu + \bar\mu_i + \hat\mu_u$.
  If the global mean rating is used as the baseline, then this scorer uses the user's average, falling back to the global mean when the user has no ratings.

\end{ClassList}

### Item-Item CF
\label{sec:lenskit:item-item}

\begin{sidewaysfigure}
  \centering
  \includegraphics[width=8in]{item-item}
  \caption{Diagram of the item-item recommender.}
  \label{fig:lenskit:item-item}
\end{sidewaysfigure}

LensKit components are also designed to be as composable as practical, so they can be combined in arbitrary fashions for maximal flexibility.
LensKit's item-item CF implementation provides item-based collaborative filtering over explicit ratings \citep{sarwar_item-based_2001} (including rating prediction) and implicit data represented as item preference vectors \citep{deshpande_item-based_2004}.
Item-based CF examines a user's profile and recommends items similar to items they have liked in the past.

The item-item implementation consists of many components; \cref{fig:lenskit:item-item} shows a typical configuration as specified in \cref{lst:lenskit:item-item}.
The core of the item-item implementation is `ItemItemScorer`, an implementation of `ItemScorer` using item-based CF.
It combines a user's preference data, computed using a summarizer, with item neighborhoods provided by an `ItemItemModel`.
Each neighborhood consists of a list of items with associated similarity scores, sorted in nonincreasing order by similarity.

\Cref{eq:lenskit:item-item} shows the basic formula for LensKit's item-item collaborative filter, where $\vec{b}_u$ is the baseline scores for each of the items in the user's summary vector $\vec{u}$, $N(i)$ is the neighborhood of $i$, and $f$ is a neighborhood scoring function.  Typically, $N(i)$ is limited to the $n$ items most similar to $i$ that also appear in $\vec{u}$.
If the normalizer $g$ is a baseline-subtracting normalizer, the formula expands to \cref{eq:lenskit:ii-norm}.

\begin{align}
  \label{eq:lenskit:item-item}
  \mathrm{score}(u, i) & = g^{-1}(f(i, N(i), g(\vec{u}))) \\
  g(\vec{r}) & = \vec{r} - \vec{b}_u \\
  \label{eq:lenskit:ii-norm}
  \mathrm{score}(u, i) & = b_{ui} + f(i, N(i), \vec{u} - \vec{b}_u)
\end{align}

Computing item scores from a neighborhood and the user vector is abstracted in the `NeighborhoodScorer` component ($f$ in \cref{eq:lenskit:item-item}).
There are two primary implementations of this interface: `WeightedAverageNeighborhoodScorer` computes the average of the user's ratings or scores for each item in a neighborhood, weighting them by the item's similarity to the target item:

\begin{align*}
  f(i, N, \vec{u}') & = \frac{\sum_{j \in N} \mathrm{sim}(i, j) u'_j}{\sum_{j \in N} |\mathrm{sim}(i, j)|}
\end{align*}

`SimilaritySumNeighborhoodScorer` simply sums the similarities of all items that the appear in the user's summary; this is useful for unary domains such as purchases where the user summary value is 1 for items the user has purchased and 0 otherwise.

The default `ItemItemModel` is `SimilarityMatrixModel`, which stores a list of neighbors for each item in memory.
It is not a full matrix, but rather a mapping from item IDs to neighbor lists forming a specialized sparse matrix.
The similarity matrix model in turn is built by the `ItemItemModelBuilder`.
The item-item model depends on two primary components: the item similarity function, specified by the `ItemSimilarity` interface, and an `ItemItemBuildContext`.
The build context consists of the ratings matrix, normalized and organized by item.
It is implemented as a map of item IDs to sparse vectors of user ratings for that item.
With this separation, the model builder only needs to compute and store item similarities, and the build context builder takes care of whatever normalization or other data pre-processing is needed.

The `ItemItemModelBuilder` can take advantage of 2 properties of the similarity function: whether or not it is symmetric, and whether or not it is sparse.
Symmetric similarity functions have their ordinary definition: a function is symmetric iff $s(i,j) = s(j,i)$.
Sparse similarity functions are functions that will return 0 if the items have no users in common.
Most common similarity functions, such as vector cosine, are both sparse and symmetric.
Conditional probability \citep{deshpande_item-based_2004} is a notable example of a non-symmetric similarity function, and item similarity functions that take into account external data such as item metadata may be non-sparse.
The `ItemSimilarity` interface has `isSparse()` and `isSymmetric()` methods to allow a similarity function to report its behavior.

If the similarity function is symmetric, the default model builder takes advantage of that by only computing the similarity between each unordered pair of items once and storing each item in the other's neighborhood.
If the similarity function is sparse, then (by default) the model builder will attempt to exploit that sparsity to reduce the number of item comparisons it actually makes.
In addition to the item-indexed rating matrix, the build context contains a mapping from user IDs to sets of item IDs that they have rated.
For each row in the similarity matrix it is building, the model builder iterates over the users that have rated the row's item, then over each of that users' items, skipping items it has already seen.
For items with few potential neighbors, this can greatly reduce the number of comparisons that need to be performed.
The sparsity exploitation is also adaptive: if, while scanning the potential neighbors for a row, the model builder gets to a point where it has processed 75\% of the items but still has at least 50\% of the row's users left to go, it skips the sparsity and just compares with the rest of the items.\footnote{These values have not been empirically tuned, but seem to work reasonably well in practice in our applications.}
In this way, it attempts to avoid situations where the bookkeeping for exploiting sparsity is more expensive than the extra item comparisons; this can happen when the data set has relatively few items compared to the number of users.
This capability can also be disabled completely if it is causing problems for a
particular data set or experiment.

The model builder also takes a few additional parameters.
`@ModelSize` controls the maximum number of neighbors retained for each item.
The model builder keeps a size-limited heap for each item, allowing it to efficiently retain the most similar neighbors for each item.
If the model size is 0, the model builder retains all neighbors.

Finally, the model builder takes a `Threshold` to filter neighbors.
The default threshold excludes all neighbors with a negative similarity.
This allows the neighborhoods to be filtered to require items to have some minimum similarity (or minimum absolute similarity).
Neighbors are filtered before being counted, so a model size of 500 retains the 500 most similar items that pass the threshold.

The item-item CF implementation also contains two variants on the basic model building process.
The `NormalizingItemItemModelBuilder` replaces `ItemItemModelBuilder` and allows item neighborhood vectors to be normalized.
Rather than accumulating item neighborhoods in a map of heap-backed accumulators, it processes items strictly one at a time, declining to take advantage of symmetry or sparsity.
After computing all the similarities in each row, it applies an `ItemVectorNormalizer` to that row's vector.
This allows techniques such as normalizing an item's neighborhood to the unit vector \citep{deshpande_item-based_2004}.
The model builder finally truncates the neighborhood with a size cap and/or a threshold and moves on to the next item.

The default item-item build context builder processes the input data on a user-by-user basis, summarizing the user's profile and applying a `UserVectorNormalizer` to the summary prior to storing each item value in its corresponding item vector.
We have found, however, that centering user ratings by item mean is an effective normalization strategy \citep{ekstrand_rethinking_2011}; processing ratings user-by-user and then storing them by item is needlessly memory- and time-intensive for this simple strategy.
The `ItemwiseBuildContextBuilder` replaces the default build context builder and processes ratings item-by-item, applying a `ItemVectorNormalizer` to each item's rating vector.
The `MeanCenteringVectorNormalizer` can be used for normalizing the item vectors normalize them by subtracting the item's average rating from each rating.
This context builder reduces both the memory and time requirements of the item-item model build process in many situations, at the expense of supporting per-user normalization and general summarizers (it only considers ratings).

To summarize:

\begin{enumerate}
\item
  The `ItemItemBuildContextBuilder` summarizes the user profiles, normalizes them, and builds the `ItemItemBuildContext`.
  The build context is a rating-indexed matrix of user-item preference measurements.
\item
  The `ItemItemModelBuilder` uses the context and the `ItemSimilarity` to build an item-item similarity matrix.
  The similarity matrix implements `ItemItemModel`.
\item
  The default `ItemSimilarity` implementation ignores the item IDs and delegates to a `VectorSimilarity`.
\item
  The `ItemItemScorer` uses the `ItemItemModel`, the `UserHistorySummarizer`, and the `UserEventDAO` to obtain the user's current profile and score items by their similarity to items the user likes.
  This is done using the `NeighborhoodScorer`, for which there are different implementations for aggregation algorithms appropriate for different types of input data.
\end{enumerate}

The LensKit-provided components have the following configuration points:

\begin{itemize}
\item The context preparation strategy (the provider for `ItemItemBuildContext`).
\item The user vector summarizer.
\item The user vector normalizer (used both for pre-processing data for the context and for normalizing and denormalizing rating in the scoring process; it is possible to configure these separately, but usually results in bad performance).
\item For itemwise context preparation, the item rating vector normalizer.
\item The model building strategy (default or normalizing).
\item For the normalizing model building strategy, the item neighborhood vector normalizer.
\item The maximum number of neighbors to retain for each item (`@ModelSize`).
\item The item similarity function.
\item The neighborhood score aggregation algorithm.
\item `@NeighborhoodSize`, the maximum number of items to use when computing each score.
\end{itemize}

In addition to supporting most standard configurations of item-item collaborative filtering, this setup allows a great deal of flexibility for novel adaptations as well.
While we have not yet done so, it would not be difficult to incorporate ranking metrics \citep{avesani_trust-enhanced_2005, ekstrand_automatically_2010} into the model building process.
In other experiments (and a homework assignment for our recommender systems course), we have completely replaced the item-item model with one that returns neighborhoods based on a Lucene index of movie tags \citep{ekstrand_when_2012}.
LensKit's item-item CF implementation has extensive flexibility while still performing well on common sizes of data sets.

### User-User CF
\label{sec:lenskit:user-user}

User-based collaborative filtering, first presented by \citet{resnick_grouplens:_1994}, is the oldest form of modern automated collaborative filtering.
Unlike item-based CF, it finds users who are similar to the active user and recommends things liked by those users.
This is typically done by using user neighborhoods to estimate the active user's preference for each item, often with a weighted average of neighbors' ratings, and recommending the top-predicted items.

LensKit's user-user CF implementation is also extensively modular, although it does not have a concept of a model.
The user-user CF code is currently limited to using explicit ratings; there are no fundamental problems we know of that would prevent it from being extended to arbitrary user summaries, we just have not yet written that code.

The central class is `UserUserItemScorer`; selecting it as the implementation of `ItemScorer` will result in a user-user collaborative filter.
The user-user item scorer uses a `UserEventDAO` to get user data, a `UserVectorNormalizer` to normalize user data (both that of the active user and their potential neighbors), and a `NeighborFinder` to find user neighbors.

The neighborhood finder has a single method that takes a user profile and a set of items that need to be scored.
It returns a collection of potential neighbors, each neighbor object representing a user with its rating vector and similarity to the active user.
The scorer uses these neighbors to score the items as shown in \cref{eq:lenskit:user-user}; $\tilde u$ denotes the normalized version of a user $u$ or a rating value.
If users are normalized by mean-centering their ratings, this equation reduces to the same formula as used by \citet{resnick_grouplens:_1994}.

\begin{align}
  \label{eq:lenskit:user-user}
  \fn{score}(u, i) = \fn{denorm}\left(\frac{\sum_{v \in N(u,i)} \fn{sim}(\tilde u, \tilde v) \tilde r_{vi}}{\sum_{v \in N(u,i)} |\fn{sim}(\tilde u,\tilde v)|}; u\right)
\end{align}

The default implementation of the neighborhood finder scans the event database for potential neighbors.
Only those users who have rated one of the items to be scored are useful as neighbors; further, with a sparse similarity function, users who have not rated any of the same items as the active user will not be good neighbors.
To optimize the search, the neighborhood finder takes the smaller of the active user's set of rated items and the set of target items, and considers all users who have rated at least one item among them.

LensKit also includes a neighborhood finder that uses the same logic but with a snapshot of the rating data stored in memory as a `model'.
This is much more efficient to access than a database for finding neighbors and makes user-user a more practical algorithm.
When using this neighborhood finder, the active user's most recent ratings are still used, but their potential neighbors are considered frozen in time as of the last time a snapshot was taken.
In production, this would likely happen nightly.

LensKit supports a full range of user similarity functions via the `UserSimilarity` interface.
This interface is equivalent to the `ItemSimilarity` interface of item-item CF, and generally delegates to a `VectorSimilarity`.

### Matrix Factorization CF
\label{sec:lenskit:mf}

LensKit provides biased matrix factorization based on the work of \citet{funk_netflix_2006} and subsequent developments \citep{paterek_improving_2007}.
Biased matrix factorization takes the rating matrix $\mat{R}$, subtracts the baseline scores (often user and item biases), and computes a factorization resembling a singular value decomposition:

\begin{align*}
  \mat{R} & = \mat{B} + \mat{W} \mat\Sigma \mat{X}^\T
\end{align*}

There are various ways of computing the decomposition of the matrix; LensKit's factorization architecture allows for different factorization algorithms to be plugged in and defaults to using gradient descent to learn user-feature and item-feature matrices \citep{funk_netflix_2006}.

LensKit's matrix factorization package consists of two main parts.
The general matrix factorization package provides components for using a biased matrix factorization independent of how it was computed:

\begin{ClassList}
\item[MFModel]
  A generic matrix factorization model, exposing the user- and item-feature matrices.
  It also stores mappings between user and item IDs and their respective row and column numbers in the matrices.
  It does not separate out the $\Sigma$ matrix of singular values (feature weights); instead, they are folded into the user and item matrices.

\item[BiasedMFKernel]
  An interface for kernel functions to recombine user- and item-feature vectors to produce a prediction.
  It takes the baseline score, user vector, and item vector, and produces a final user-item score.
  The default implementation, `DotProductKernel`, adds the dot product of the vectors to the baseline score:
  \begin{align*}
    \fn{score}(u,i) & = b_{ui} + \mat{w}_{(u)} \cdot \mat{x}_{(i)}
  \end{align*}

  An alternate implementation, `DomainClampingKernel`, operates like the dot product kernel but clamps the value to be within the valid range of ratings after each addition (numbering features $1$ through $f_{\fn{max}}$) \citep{funk_netflix_2006}:
  \begin{align*}
    \fn{score}(u,i) & = s(u, i, f_{\fn{max}}) \\
    s(u, i, f) & = \begin{cases}
      b_{ui} & f = 0 \\
      \fn{clamp}(s(u, i, f-1) + w_{uf} x_{if} & f > 0
    \end{cases}
  \end{align*}

\item[BiasedMFItemScorer]
  Uses a baseline scorer, `MFModel`, and `BiasedMFKernel` to score items for users, implementing the `ItemScorer` interface.
\end{ClassList}

The general biased MF classes can produce scores, but have no way to learn the model.
The regularized gradient descent (FunkSVD) classes fill in this gap and provide some additional functionality.
`FunkSVDModelBuilder` builds a `FunkSVDModel` (a subclass of `MFModel`) using gradient descent over the ratings in the system.
It learns the features one at a time, training each to convergence before moving on to the next; this iteration is controlled by a learning rate $\lambda$, a regularization coefficient $\gamma$, and a stopping condition (usually an epoch count or a threshold).
\Cref{lst:funk-svd} shows the algorithm for training the model.

\begin{listing}[tbh]
\begin{algorithmic}[1]
\Procedure{TrainMF}{$R, k$}
\State shuffle list of ratings
\State $W \gets$ new $m \times k$ matrix filled with $0.1$
\State $X \gets$ new $n \times k$ matrix filled with $0.1$
\For{$f \gets 1 \text{ to } k$}
  \Repeat
    \For{rating $r_{u,i}$ in $R$}
      \State $p_{u,i} \gets b_{u,i} + \sum_{k=1}^f u_{u,k}m_{i,k}$
      \State $\epsilon \gets r_{u,i} - p_{u,i}$
      \State $w_{u,k} \gets w_{u,k} + \lambda (\epsilon x_{i,k} - \gamma w_{u,k})$
      \State $x_{i,k} \gets x_{i,k} + \lambda (\epsilon w_{u,k} - \gamma x_{i,k})$
    \EndFor
  \Until{feature $f$ converges}
\EndFor
\State \Return $W, X$
\EndProcedure
\end{algorithmic}
\caption{FunkSVD training algorithm.}
\label{lst:funk-svd}
\end{listing}

The factorization produced by this algorithm is not a well-formed singular value decomposition.
It does not have a distinct $\mat\Sigma$ matrix, but that can be extracted from $\mat W$ and $\mat X$ by setting $\sigma_f = \|\mat w_{(f)}\|_2 \|\mat x_{(f)}\|_2$.
More importantly, the left and right matrices do not form an orthogonal basis as they do in a true SVD.
As a result, standard SVD and latent semantic analysis techniques such as computing updated user and item vectors by `folding in' \citep{berry_using_1995, sarwar_incremental_2002} do not operate correctly.

The base MF item scorer, `BiasedMFItemScorer`, does not do any updating of user or item vectors: if the user does not have a feature vector in the model, it just returns the baseline scores.
`FunkSVDItemScorer` is more sophisticated: it can take the active user's current rating vector and do a few rounds of gradient descent to freshen up their feature vector prior to computing scores.
If the user is new and does not have a feature vector in the model, it will use the average user weight for each feature as the starting point.\footnote{We do not yet have a lot of experience using this code in production, so it is not well-tested and its behavior is not yet well understood.}

For efficient iteration, the `FunkSVDItemBuilder` uses a helper structure, a `PackedPreferenceSnapshot`, to represent the data over which it is to train.
Currently, packed preference snapshots are built from rating data directly, but alternative means of building them would allow FunkSVD to operate on other types of data without further changes.

### Configuring Algorithms
\label{sec:lenskit:dsl}

On top of Grapht's configuration API (\cref{sec:grapht:api}), LensKit provides a simple syntax for configuring recommender algorithms.
This syntax is implemented as an embedded domain-specific language in Groovy, a popular scripting language for the Java virtual machine with good facilities for building fluent syntaxes.

The syntax is a relaxed version of the Grapht API with some scoping conveniences for managing context-sensitive configuration.
\Cref{lst:lenskit:item-item} shows an example configuration of an item-item collaborative filter as a Groovy script.

\begin{listing}
  \input{lst/item-item.groovy}
  \caption{Item-item configuration file (producing the setup in \cref{fig:lenskit:item-item}).}
  \label{lst:lenskit:item-item}
\end{listing}

This syntax provides a more syntactically lightweight means of configuring recommenders than full Java syntax.
It also allows recommender definitions to be treated as configuration files rather than embedded in the source files of an application, and the LensKit command line tools operate on these scripts.

## Offline Evaluation
\label{sec:lenskit:evaluator}

LensKit's evaluation toolkit provides support for running offline, data-driven evaluations of recommender performance using a traditional train/test approach with cross-validation.
We intend it to be a versatile platform for reproducible recommender evaluations and experiments; in our own work, we generally publish the evaluation scripts used to produce our results \citep{ekstrand_rethinking_2011, ekstrand_when_2012}, and we encourage others to do the same.

The following goals drove the design of the LensKit evaluator:

\begin{itemize}
\item
  Writing evaluations should be easy, with minimal cumbersome syntax.
\item
  Best practices should be the default.
\item
  The toolkit should be flexible enough to reproduce a wide range of experiments, including those with flawed methodologies, and experiment with new evaluation techniques.
\item
  Evaluations should be as efficient as possible.
\item
  It is not LensKit's job to analyze the results of the evaluation.
  Evaluation output (metrics, actual predictions and recommendations, etc.) should be written to CSV files for further analysis with R, Excel, SciPy, or other software.
\end{itemize}

The LensKit evaluator provides facilities for processing data sets (crossfold splitting, subsampling, format conversion) and evaluating algorithms over multiple train-test data sets and measuring their performance.

### Evaluation Scripts
\label{sec:lenskit:eval-scripts}

LensKit evaluations are defined with Groovy scripts, using an embedded DSL to describe different types of evaluation actions.
Evaluations are organized around *tasks*, such as `crossfold` (to partition data for cross-validation) and `trainTest` (to run a train-test evaluation over one or more data sets).
Tasks can optionally be contained within *targets*; in this case, their execution is deferred until the target is executed, allowing a single evaluation script to define multiple evaluation capabilities.\footnote{The `target' functionality will be deprecated in the future, as we plan to simplify the LensKit evaluator to be controlled by the Gradle build system instead of implementing its own build logic.}
\Cref{lst:lenskit-eval} shows an example evaluation script of two algorithms over the MovieLens 100K data set.

\begin{listing}
    \input{lst/eval.groovy}
  \caption{Example of a LensKit evaluation script.}
  \label{lst:lenskit-eval}
\end{listing}

Since these scripts are written in a full programming language, researchers have a great deal of flexibility in the configurations they can generate.
For example, it is common to generate algorithm definitions in a loop over some parameter such as neighborhood size in order to plot accuracy as those parameters change.

We will not go into all the details here, but LensKit intercepts Groovy method calls to delegate evaluation directives to various constructors and `addFoo`/`setFoo` methods on LensKit classes.
For example, to evaluate the `crossfold` block in \cref{lst:lenskit-eval}, LensKit does the following:

\begin{enumerate}
\item
  Look up the `crossfold` method in a properties file on the classpath and find that it is implemented by the `CrossfoldTask` class.
\item
  Call the task class's constructor with the argument `"ml-100k"`.
\item
  Evaluate the block with a *delegate* (a Groovy mechanism for intercepting method and property references when evaluating closures or code blocks); this delegate implements the rest of the logic.
\item
  Translate the `source`, `holdout`, and `partitions` calls into calls to `setSource`, `setHoldout`, and `setPartitions` on the task class.
\item
  Call the `call()` method on `CrossfoldTask` to run the crossfold and obtain a list of train-test data source objects representing each of the 5 splits it will generate.
\end{enumerate}

The resulting list is then handled by the delegate in use to configure the `trainTest` block; that delegate forwards the call of `dataset` with a list of data sets (returned from `crossfold`) into multiple calls to `TrainTestTask`'s `addDataset` method.

Groovy's extensive functionality for customizing code evaluation allows us to provide an evaluation scripting syntax that reads like a structured, declarative configuration file, while allowing users to take advantage of a full programming language when their needs so require.

### Data Sets
\label{sec:lenskit:eval-data}

The evaluator operates with data primarily in two forms: delimited text files and binary rating files.

The primary data management tasks are as follows:

\begin{description}
\item[crossfold]
  The crossfold task takes a single data source of ratings data and splits in into $N$ partitions for cross-validation.

\item[subsample]
  The subsample task takes a single data set of ratings and randomly sub-samples them by user, item, or rating to produce a smaller data set.

\item[pack]
  The pack task takes a data set and packs it into a binary file for efficient access.
\end{description}

The default crossfold configuration splits the users evenly into $N$ partitions.
For each partition, the test set consists of selected ratings from each user in that partition, and the training set consists of those users' non-selected ratings along with all ratings from the users in the other partitions.
User ratings can be selected by picking a fixed number of ratings (`holdout`), a fraction of the ratings (`holdoutFraction`), or picking all but a fixed number of ratings (`retain`).
The test ratings can also be selected randomly or by timestamp (with later ratings going into the test set).

In addition to user partitioning, the crossfolder supports partitioning ratings evenly into $N$ partitions, and creating $N$ samples of fixed size of the users (allowing $N$ partitions of a large data set with fewer users per partition; this can decrease the time required to run experiments on data sets with large numbers of users).

Many algorithms benefit from having the rating data available in memory in order to train the model and compute predictions and recommendations.
Repeatedly scanning a delimited text file is very time-intensive.
Loading a large data set into the Java heap with an object per rating, however, takes a good deal of memory and places additional strain on the garbage collector.
In early versions of LensKit, we tried to use the SQLite embedded DBMS to provide indexed access to ratings, but it did not perform nearly as well as in-memory data.

LensKit now uses packed binary rating files to provide efficient data access for recommender evaluation.
These files are read using memory-mapped IO, so on systems with adequate RAM the data lives in memory and the operating system's cache manager can take care of paging data in and out of memory as appropriate.
The bulk of the file consists of rating data in binary format, either $(u, i, r)$ or $(u, i, r, t)$ tuples.
The tuples are stored in timestamp order.
The file also contains user and item indices; for each user (resp. item), the index stores the user (resp. item) ID, its rating count, and indices into the tuple store for its ratings.
The indices are stored in user/item order and can be searched with binary search.
This format provides very memory-efficient storage and, when paired with fast iteration, time-efficient data access.
In addition to the `pack` eval task, LensKit provides a `pack-ratings` command in on the command line (\cref{sec:man:lenskit-pack-ratings}) to pack a rating file.

The data set tasks, along with additional helpers such as the `csvfile` builder to define a CSV data source, produce data set objects (either `DataSource`, for a single source of ratings data, or a `TTDataSet` for a train-test pair of data sources) that can be manipulated by the eval script or passed directly  to other data processing classes or the `dataset` directive of the train-test evaluator.
Data sets are identified by a name as well as optional attributes; attributes are stored in a map, and the output CSV files contain a column for each distinct attribute name used across the data sets.

### Measuring Performance
\label{sec:lenskit:eval-train-test}
\label{sec:lenskit:eval-metrics}

The evaluator takes a set of algorithms and a set of train-test data sets and evaluates each algorithm's accuracy over each train-test pair.
For each algorithm and data set, the evaluator builds a recommender model (if applicable) over the training data and attempts to recommend or predict for each user in the test data.
It runs various metrics on the recommendations or predictions and reports their results in a CSV file.
Like data sets, algorithms can also have attributes associated with them that appear as columns in the CSV output; in this way, if there is a loop over values of some parameter, those values can appear in their own columns so the analysis code does not need to parse them out of algorithm identifier strings.

Metrics can report results in three ways: they can produce per-user data values, which will be included in an optional CSV file of per-user metrics; they can produce aggregate values over an entire experiment configuration (algorithm / data set pair); and they can write outputs to files entirely under their control.
LensKit provides the following metrics:

MAE
:   Mean absolute error of predicting test ratings,  available in both user-averaged and global variants.
    This metric ignores unpredictable ratings.

RMSE
:   Root mean squared error of predicting test ratings, available in both user-averaged and global variants.
    Like MAE, it ignores unpredictable ratings.

Coverage (predict)
:   Measures the number of attempted and provided rating predictions to compute coverage.

Predict nDCG
:   Normalized discounted cumulative gain \citep{jarvelin_cumulated_2002} used as a rank accuracy metric over predictions.
    We rank the test items by predicted rating and compute the nDCG of this ordering, using the user's actual rating of each item as its utility or gain.

Predict half-life utility
:   nDCG computed using a half-life decay for the discount function \citep{breese_empirical_1998}.
    This metric has the benefit of being rooted in a probabilistic model of user behavior, as well as discounting the second item (when using logarithmic discounting of base $b$, typically 2 in traditional nDCG, the first $b$ items have maximum weight).

Top-$N$ nDCG
:   nDCG computed over fixed-length recommendation lists.

Top-$N$ Precision and Recall
:   Precision and recall computed over fixed-length recommendation lists.

The predict metrics use the algorithm's `RatingPredictor` to predict the user's ratings for the test items.
The top-$N$ metrics use the algorithm's `ItemRecommender` to produce a recommendation list.
The candidate set, exclude set, and (if needed) set of `good' items can all be configured; a common configuration uses an exclude set of the user's training items and a candidate set of either all items or the user's test items plus a random set of `bad' items.
We plan to add more metrics in the future.

Recommender evaluation is a subject of significant interest and research \citep{gunawardana_survey_2009, bellogin_performance_2012}.
The recommender systems research community is currently in the process of establishing best practices for robust and reproducible recommender research, particularly for offline experiments, where a diverse set of metrics and subtle variations in experimental protocols make research results difficult to reproduce or compare \citep{konstan_toward_2013}.
One of LensKit's aims is to reduce this confusion and provide a standardized evaluation platform \citep{ekstrand_rethinking_2011}, a goal shared by the developers of other systems such as mrec\footnote{\url{https://github.com/Mendeley/mrec}} and RiVal\footnote{\url{https://github.com/recommenders/rival/}}.
As the research community develops consensus on best practices in experimental protocols and evaluation metrics, we will be adjusting LensKit to use those best practices by default (although perhaps not immediately, to provide a reasonable migration path for incompatible changes).

### Improving Experimental Throughput
\label{sec:lenskit:eval-throughput}

The train-test evaluator provides two important features for improving the throughput of recommender evaluation.

The first is support for parallelizing evaluations.
On multicore systems, LensKit can run the evaluations for multiple algorithm configurations and/or data sets (within a single train-test task) in parallel.
It can run the evaluations all together, or isolate them by data set (so that only one data set's structures need to be loaded into memory at a time — this is useful on low-memory systems or with very large data sets).

The second is the ability to identify and share common components between different algorithm configurations.
For example, the neighborhood size does not affect the item-item similarity matrix in item-item CF; an experiment testing many neighborhood sizes will be faster and take less memory if it computes the similarity matrix once and using it for all experiments.
LensKit automatically identifies the identical components of the configuration graphs of different algorithm configurations and arranges for such components to be computed once and shared.
The caching logic uses Java's soft references to share the same in-memory representation of such components between all active algorithms that require them, while allowing them to be garbage collected when no longer needed.
If a cache directory is configured, the common components will be written to disk so that they do not need to be entirely recomputed if they are garbage collected and then needed again.
The evaluator uses the same logic as the web integration support (\cref{sec:lenskit:web}) to identify shareable components.

With these two features, LensKit provides useful support for taking advantage of multicore shared-memory architectures for recommender evaluation.

## Web Integration
\label{sec:lenskit:web}

Web server environments place particular requirements on the software that integrates with them.
Typical Java web application servers, such as Tomcat, handle each HTTP request in a separate thread.
When a request comes in, the request handler is started up; if it needs database access, it opens a connection (typically from a connection pool), does the required processing, and returns the database connection to the pool.
Some architectures lease database connections to request handlers on an even shorter-term basis, such as once for each database operation\footnote{The Java drivers for MongoDB use this design.}.

With LensKit's use of dependency injection, all dependencies must be available before an object can be instantiated.
For components that require database access, this means that the database connection must be available to create the required DAOs, after which the component itself can be instantiated.

A typical LensKit recommender algorithm will require both database access (to get the user's current ratings or interest profile) and model data (such as a factorized matrix) to produce recommendations.
Rebuilding the model for each web request would be prohibitively expensive; we would prefer to compute the model once, load it into memory, and share the same model across all web requests.
LensKit algorithms are designed for this: the model object is stand-alone and thread-safe.
It is built by a separate builder component, and a light-weight item scorer component combines the model and live data from the database to produce recommendations.

To implement and use this functionality, however, the software must do several things:

\begin{itemize}
\item
  Identify the components to be shared.
\item
  Instantiate the shared components.
\item
  Arrange for the shared components to be used to satisfy the dependencies of the per-request components.
\end{itemize}

It would certainly be possible to do this manually.
However, that requires each algorithm developer to provide code to accomplish this separation for their algorithm (which may not work correctly for potential extensions of their algorithm), or for the application developer to build and maintain code to instantiate shared objects for the algorithm they are using (making it more cumbersome to change algorithms).

LensKit takes advantage of Grapht's support for analyzing and manipulating object graphs prior to instantiating them in order to provide implementation-independent support for these tasks (\cref{sec:grapht} describes the Grapht side of these capabilities in much more detail).
It takes a single description of the complete recommender component graph and identifies the *shareable* objects.
Shareable objects can be pre-computed, shared between algorithm instances in multiple threads, and generally serialized to disk for use in other processes.
It then instantiates the shareable objects and creates a new dependency injection graph with the pre-instantiated objects in place of their original configurations for use in later instantiations of the recommender.
This is encapsulated in the `RecommenderEngine` type.

The workflow therefore looks like this:

\begin{enumerate}
\item
  Prepare a `LenskitConfiguration` describing the complete algorithm configuration.
  At this point, the developer does not need to consider at all what components will be shared and what ones will be reinstantiated.
\item
  Build a `RecommenderEngine` from the configuration, instantiating all shared components.
\item
  For each web request, ask the recommender engine to create a `Recommender`, encapsulating a fresh recommender combining the model with whatever database connections and other ephemeral resources are needed.
\end{enumerate}

\begin{figure}[tbh]
  \centering
  \includegraphics[width=4in]{injection-diagram}
  \caption[Object containers in a LensKit web application.]{Object containers in a LensKit web application\footnotemark.}
  \label{fig:injection-diagram}
\end{figure}

\footnotetext{Diagram by Michael Ludwig, published in \citep{ekstrand_rethinking_2011}.}

\Cref{fig:injection-diagram} shows this in practice.
Each configured object graph is encapsulated in a *container* (`Recommender` is a container, as is `RecommenderEngine`).
The per-request recommender containers reuse objects from the shared container in the engine, in addition to the objects that must be isolated per request.

To designate a component for pre-instantiation and sharing, the algorithm developer annotates it with the `@Shareable` annotation.
Components with this annotation must be thread-safe and should generally be `Serializable`.
LensKit will pre-instantiate and reuse such a component if and only if all of its dependencies are also shareable.
This analysis means that if a shareable component is configured so that one of its dependencies that is generally shareable no longer is, it will automatically be downgraded to a non-shared component without the developer needing to do any checking or enforcement.

LensKit also provides a `@Transient` annotation for dependencies to indicate that a particular dependency should not be considered when determining a components shareability.
If a component marks one of its dependencies as transient, it is promising that the dependency will only be used to build the object, and the built object will not retain a reference to it.
For example, the item-item model builder's dependency on the data source is marked as transient, since it uses the data source to build the model but the final model is independent of it.

The final result of these manipulations is that each web request instantiates a set of lightweight objects that combine the current connection with heavyweight recommender components to provide the recommendation services of the rest of the application.
We have successfully integrated this architecture with multiple web applications that are currently used in production.
