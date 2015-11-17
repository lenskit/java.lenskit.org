---
title: LensKit APIs
---

# LensKit APIs

The public API defined by LensKit is accessed via the `Recommender` interface introduced in \cref{sec:lenskit:intro}.
Its primary implementation, `LenskitRecommender`, encapsulates the components that make up a particular recommender and makes them available to client applications.
A `Recommender` does not define any particularly interesting behavior on its own; all it does is provide access to the implementations of interfaces for particular recommendation tasks.
LensKit does not provide any other implementations of `Recommender`; it is separated from its implementation and included in the public API to provide a place to implement shims around other recommender implementations, making it possible to adapt other implementations such as Mahout to make be usable in LensKit-based applications.

\begin{figure}[tbp]
  \centering
  \input{lenskit-api-diagram}
  \caption{Diagram of LensKit API components}
  \label{fig:lenskit:api-diagram}
\end{figure}

\Cref{fig:lenskit:api-diagram} shows the components that make up LensKit's public API, and how they typically interact.
The central component of most LensKit recommenders is an implementation of the `ItemScorer` interface.
The various recommendation techniques implemented by LensKit differ primarily in the item scorer they implement; in almost all cases, the algorithm to be used is configured by selecting an item scorer implementation to use (in \cref{lst:example-setup}, this is done inside `item-item.groovy` configuration file).

An item scorer is a generalization of the *predict* capability, computing general user-personalized scores for items.
No assumptions are made or implied about what the scores mean, except that higher scores should indicate `better' items, for some definition of `better' that makes sense in the context of the application and algorithm.
When operating on rating data, many item scorer implementations compute scores by predicting user ratings; this generalization to scores, however, allows components to operate with non-rating-based (e.g. purchase or click count data) without artificial meanings.
Implementing a new algorithm for LensKit is usually done by creating a new item scorer implementation, as most algorithms are mechanisms for producing personalized scores.

Most applications embedding LensKit will not use the item scorer directly, however.
Instead, they will use the `RatingPredictor` and `ItemRecommender` interfaces, providing support for the traditional *predict* and *recommend* tasks respectively.

The rating predictor and item scorer interfaces are identical (with the methods renamed from `score` to `predict`), but the contract of `RatingPredictor` carries the additional guarantee that its scores are interpretable as predicted ratings.
Separating the item scorer and rating predictor interfaces — and the components implementing them — provides three major advantages.
First, it frees up individual scorer components from dealing with some of the details of rating prediction, such as clamping ratings to the range of valid ratings and possibly quantizing them, keeping the code conceptually simple.
Second, it consolidates code for sanitizing scores to be interpretable as ratings in one place (the default `RatingPredictor` implementation), reducing code duplication.
Third, it allows alternative strategies for mapping scores to predicted ratings, such as OrdRec \citep{koren_ordrec:_2011}, to be easily swapped in and used on top of LensKit's existing item scoring capabilities.

The item recommender interface provides lists of recommendations for a particular user in the system.
The application using it provides a user ID, the desired number of recommendations $n$, and optionally an *candidate* set $C$ and/or an *exclude* set $E$ of item IDs to constrain the recommendations.
The recommender will return up to $n$ recommendations from $C \backslash E$.
If unspecified, $C$ defaults to all recommendable items and $E$ defaults to the items the user has rated or purchased (although individual item recommender implementations may change these defaults).
These sets allow the application to use LensKit in situations such as recommending from among the items in one particular category or matching some search query.

LensKit also exposes an interface `GlobalItemRecommender` (and an associated `GlobalItemScorer` for ‘global’ (non-personalized) recommendation that does not take the user into account, but operates with respect to zero or more items.
Applications can use it to implement a ‘similar items’ feature or to provide recommendations based on the contents of a shopping basket.

\begin{listing}[tbh]
  \JavaSource{lst/interfaces.java}
  \caption{Simplified LensKit interfaces.}
  \label{lst:interfaces}
\end{listing}

\Cref{lst:interfaces} lists the core methods exposed by several of the interfaces in the LensKit API.
\Cref{sec:lenskit:mod-algorithms} describes many of implementations LensKit provides of these interfaces.
