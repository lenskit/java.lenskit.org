---
title: Data Access
---

# Data Access in LensKit

LensKit abstracts data access using *data access objects* (DAOs).  This page explains some of how these work and how to use them.  It is aimed at users integrating LensKit into an application; for more information on configuring data sets in the evaluator, see the [evaluator documentation](../evaluator/).

LensKit provides several DAO implementations for in-memory storage, delimited text files, and basic database storage (using JDBC).

LensKit's data access is all read-only.  LensKit does not provide any facilities for modifying the rating data; if you need to modify data while LensKit is running, just write the new data directly to the database and provide a LensKit DAO that reads this data.  Prebuilt model components will be out of date with respect to the new data, but many components will take into account the latest data when producing recommendations.

## Data Model

The core element of LensKit's data model is an *event*, represented by the [Event][] interface.  An event is an action that occured between a user and an item, optionally with a timestamp.  One type of event is a [Rating][], where the user applies a preference to an item (or removes it).  Applications can define additional types of events; all event types must extend the Event interface.

[Event]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/data/event/Event.html
[Rating]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/data/event/Rating.html

Users and items are both represented by `long` IDs.  LensKit places no restrictions on these IDs; they can be any long, positive or negative.

## Cursors

Several of the DAO methods return [Cursor][] objects.  A Cursor is just like an iterator, except it also must be closed once you are done using it, since it might be reading from a file or database connection.  It's also `Iterable`, so you can use it in a for-each loop; the cursor can only be iterated once.

In the data access layer, a method named `streamFoo` will return a cursor.  A method named `getFoo` will return an object (which may be a list or a set, but will not be a cursor that client code must close).

[Cursor]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/cursors/Cursor.html

## Data Access Interfaces

LensKit provides several DAO interfaces to allow components to access data.  These components are all in the [org.grouplens.lenskit.data.dao][dao] package.  The basic ones are:

[dao]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/data/dao/package-summary.html

- `EventDAO` provides access to the database of events.  It allows the entire set of events to be streamed, optionally filtered by type or sorted.
- `UserEventDAO` provides access to events by user ID.
- `ItemEventDAO` provides access to events by item ID.
- `UserDAO` provides access to users.  The base interface only provides the set of all user IDs in the system; custom DAOs providing additional information about users (e.g. user profile data) should extend `UserDAO`.
- `ItemDAO` provides access to items.  Like `UserDAO`, the base interface only provides access to item IDs; it can be subclassed to provide additional data about items (e.g. tags).

The only DAO you absolutely must provide is the `EventDAO`.  The other interfaces all have default implementations.  These default implementations are not very suitable for building live applications, however, as they read the entire rating database into memory when they are first used and don't update themselves after that; they're great for doing simple recommender experiments from flat text files.

## Provided DAO Implementations

Lenskit provides several DAO implementations:

- [SimpleFileRatingDAO][] implements `EventDAO` by reading ratings from a delimited text file.
- [EventCollectionDAO][] implements `EventDAO` in terms of a collection (usually a list) of `Event` objects.
- [JDBCRatingDAO][] implements all the DAO interfaces by reading data from a table of ratings in an SQL database.

[SimpleFileRatingDAO]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/data/dao/SimpleFileRatingDAO.html
[EventCollectionDAO]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/data/dao/EventCollectionDAO.html
[JDBCRatingDAO]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/data/sql/JDBCRatingDAO.html

## CSV Files

The easiest way to load data, if you just want to generate some recommendations and aren't building a live application, is to do so from a delimited file (e.g. CSV/TSV).  This can be done with `SimpleFileRatingDAO`:

~~~java
EventDAO dao = SimpleFileRatingDAO.create(new File("ratings.csv"), ",");
LenskitConfiguration config = new LenskitConfiguration();
config.bind(EventDAO.class).to(dao);
~~~

## Databases

We provide basic database support in the [JDBCRatingDAO][].  This class implements all the DAO interfaces on top of an SQL database using JDBC.

It uses two things: a JDBC connection, and an `SQLStatementFactory`.  The statement factory produces the SQL queries for each of the query types supported by the DAO.

LensKit provides [BasicSQLStatementFactory][], which produces queries over a single table of ratings.  The names of the table and the user, item, rating, and timestamp columns can all be customized.

[BasicSQLStatementFactory][]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/data/sql/BasicSQLStatementFactory.html

We expect that many applications will implement their own DAOs to connect to their data state.

### Simple Connections

For a simple database setup, you can configure the DAO like you do a file DAO:

~~~java
Connection cxn = /* open JDBC connection */;
try {
    JDBCRatingDAO dao = new JDBCRatingDAO(cxn, new BasicStatementFactory());
    LenskitConfiguration config = new LenskitConfiguration();
    config.addComponent(dao);
    /* additional configuration */
    LenskitRecommender rec = LenskitRecommender.build(dao);
    /* do things with the recommender */
} finally {
    cxn.close();
}
~~~

The `addComponent` method registers `dao` in such a way that it is used to provide all the DAO interfaces it implements.  This method is new in LensKit 2.1; in LensKit 2.0, use `.bind(JDBCRatingDAO.class).to(dao)` to achieve the same effect.

### Reconfiguring Data Access

The simple connection strategy doesn't work so well in some important situations:

-   When the model is pre-computed and saved to disk to be used by
    another process (e.g. the web server).
-   Web applications where you want to create a `LenskitRecommender`
    per-request from the same `LenskitRecommenderEngine` (the recommended strategy).

There are two primary ways to deal with this problem:

1.  Make the DAO generic get a database connection from a pool or
    service locator for each call to one of its methods, returning the
    connection when the method is finished or when the cursor it
    returns is closed.
2.  Use a fresh DAO object for each recommender.

The first method is doable with LensKit 2.0.  The second is enabled by LensKit 2.1, and allows a great deal of flexibility in how applications build their models and reintegrate them into the running application.

[LenskitRecommenderEngineBuilder]: http://dev.grouplens.org/lenskit/master/apidocs/org/grouplens/lenskit/core/LenskitRecommenderEngineBuilder.html

To use a fresh DAO for each recommender, you first need to build the model with the DAOs removed.  To do this, use two separate `LenskitConfiguration`s: one for the algorithm, and one for the data access.  You'll also need to use [LenskitRecommenderEngineBuilder][] to get more control over the recommender build process.  Like this:

~~~java
LenskitConfiguration config = /* algorithm configuration */;
JDBCRatingDAO dao = /* create DAO */;
LenskitConfiguration dataConfig = new LenskitConfiguration();
dataConfig.addComponent(dao);
LenskitRecommenderEngine engine =
    LenskitRecommenderEngine.newBuilder()
                            .addConfiguration(config)
                            .addConfiguration(dataConfig,
                                              ModelDisposition.EXCLUDED)
                            .build();
~~~

The recommender engine is now free of the DAO.  Adding the data configuration with the model disposition `EXCLUDED` tells LensKit to modify the recommender engine's representation of the configuration to use placeholders instead of the actual DAO objects.  This means that the engine cannot directly be used, but it can be serialized or passed around after the database connection used to build it has been closed.

To reconstitute the recommender, the easy way is to provide the data configuration to the `createRecommender` method.  For example, you could wrap a web request handler in code like this:

~~~java
Connection cxn = /* get DB connection */;
try {
    JDBCRatingDAO dao = /* create DAO */;
    LenskitConfiguration dataConfig = new LenskitConfiguration();
    dataConfig.addComponent(dao);
    LenskitRecommender rec = engine.createRecommender(dataConfig);
    /* process web request */
} finally {
    cxn.close();
}
~~~

This version of `createRecommender` mixes the provided configuration back in to the recommender engine to produce a recommender, connected to a new live connection to your data source.

### Serializing to Disk

You can also serialize the DAO-free model to disk:

~~~java
engine.write(new File("model.bin"));
~~~

And read it back in:

~~~java
engine2 = LenskitRecommenderEngine.load(new File("model.bin"));
~~~

If you went with option (1) in the previous section, so your DAO objects obtain database connections from a pool or some other service and don't need to be configured separately for each web request, you can re-add the DAO configuration when you load the engine.  This is useful to use a different configuration when you build the modle than when you use it in production (e.g. to build models from a read-only snapshot of the database). Example:

~~~java
engine2 = LenskitRecommenderEngine.newLoader()
                                  .addConfiguration(dataConfig)
                                  .load(new File("model.bin"));
~~~

### Restrictions

Unfortunately, you can't mix these two strategies, adding
configuration at load time that further depends on configuration to be
supplied when the recommender is created.  The loaded recommender must
either have no placeholders, or not be modified at all when it is
loaded.
