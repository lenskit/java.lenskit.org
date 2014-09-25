[sv]: http://lenskit.grouplens.org/maven-site/apidocs/org/grouplens/lenskit/vectors/package-summary.html

# LensKit Sparse Vectors

LensKit uses [sparse vectors][sv] a lot in its implementation and exposes them via some of the public APIs.  If you're using LensKit, and especially if you are building algorithms for it, you will need to be able to use the sparse vector classes.

## Can I see some code?

~~~java
// create a vector with valid keys 3, 5, 7
MutableSparseVector msv = MutableSparseVector.create(3, 5, 7);
msv.set(3, 4.0);
msv.set(5, 4.5);
assert msv.get(5) == 4.5;
assert msv.containsKey(5);
// 7 has not been set, so it doesn't exist!
assert !msv.containsKey(7);
assert msv.size() == 2;
msv.set(4, 4.5); // throws IllegalArgumentException, 4 is not a valid key
~~~

## What are they?

A LensKit sparse vector is a mapping of long keys to double values, much like a Fastutil `Long2DoubleMap`.  It is optimized for performing fast linear algebra operations, low memory use, and good (and predictable) overall efficiency.

There are three main classes involved in the sparse vector API:

`SparseVector`
:   The root class of the sparse vector hierarchy; it provides a read-only API with all the query operations (`containsKey`, `get`, etc.).  It also provides some basic linear algebra and statistical operations (sum, mean, Euclidean length, dot product).

`ImmutableSparseVector`
:   Adds no new methods, but guarantees that the vector will not be modified.  Immutable sparse vectors also cache their lengths, sums, means, etc., so that those operations are fast when repeatedly applied.

`MutableSparseVector`
:   Adds mutation methods (set, add, subtract, multiply, etc.).

## How to I create one?

There are several ways you can create a sparse vector.

From a map:

~~~java
Map<Long,Double> someMap = /* create a map */;
// create an immutable vector
SparseVector sv = ImmutableSparseVector.create(someMap);
// or a mutable one
MutableSparseVector msv = MutableSparseVector.create(someMap);
~~~

With some keys, filled with a value:

~~~java
Set<Long> keys = /* get keys from somewhere */;
MutableSparseVector msv = MutableSparseVector.create(keys, 4.5);
assert msv.size() == keys.size();
// msv now maps every key in keys to 4.5
~~~

With some valid keys, but empty:

~~~java
Set<Long> keys = /* get keys from somewhere */;
MutableSparseVector msv = MutableSparseVector.create(keys);
// the vector is empty
assert msv.size() == 0;
// but has the keys (more on this later)
assert msv.keyDomain().equals(keys);
~~~

With some fixed keys (mostly useful in unit tests):

~~~java
MutableSparseVector msv = MutableSparseVector.create(4, 9, 27);
assert msv.size() == 0;
~~~

## How do I get the values out?

All sparse vectors have a `get` method, a lot like `get` in the standard Java `Map` interface.  You give it a key, and it gives you the value:

~~~java
sv.get(5);  // yields the value of 5, or throws IllegalArgumentException
~~~

You can specify a default value:

~~~java
sv.get(5, 0);  // yields the value of 5, or 0 if 5 is not in the vector
~~~

You can also iterate over a vector in terms of `VectorEntry` objects.  These contain keys and values:

~~~java
for (VectorEntry e: sv) {
    System.out.format("%d: %s\n", e.getKey(), e.getValue());
}
~~~

Sparse vectors also support *fast iteration*, a concept borrowed from the Fastutil library.  Since vectors don't actually store `VectorEntry` objects internally, they have to create a fresh one for each iteration of a loop.  Fast iteration allows the vector to modify and re-use the same entry object each time:

~~~java
for (VectorEntry e: sv.fast()) {
    // e may be the same object each time, modified to point
    // to the next key-value pair.
    System.out.format("%d: %s\n", e.getKey(), e.getValue());
}
~~~

Fast iteration is only appropriate if your loop just examines the entry object in the loop body and does not retain a reference to it anywhere.  When applicable, it allows you to quickly iterate over a vector without putting as much pressure on the garbage collector.  In practice, most loops are suitable for fast iteration.

## How do I put values in?

You can create a vector with data from a map, or a set of keys and a constant value, as shown in the previous section.

But you often want to populate a vector with more interesting values.

First, you need to create a mutable vector.  The vector must be created with all the keys you will need; once a vector is created, you cannot add new keys.  If you need to build up a vector but don't know in advance the keys you will need, it's probably best to use a `Long2DoubleMap` and then use it to populate a vector.

So you have the keys you need, we'll call the set containing them `keys`.   This should be a `Set<Long>`; if it is a Fastutil `LongSet`, the vector code will detect that and create the new vector without boxing all the keys.  Create the vector:

~~~java
MutableSparseVector msv = MutableSparseVector.create(keys);
~~~

Now, this vector is empty, but has `keys` as its set of valid keys (called the *key domain*).  If the key domain contains 5, we can set the vector's value for 5:

~~~java
msv.set(5, Math.PI);
~~~

The key domain must contain any key we want to set.  `set` throws `IllegalArgumentException` if it is asked to set a key that is not in the key domain.

We can also *fill* the vector, setting every key in the domain to the same value:

~~~java
msv.fill(Math.E);
~~~

You can also modify a vector while iterating over it:

~~~java
for (VectorEntry e: msv.fast()) {
    // note that we set e directly, not e.getKey()
    msv.set(e, Math.log(e.getValue()));
}
~~~

## Keys and key domains - what's up with that?

Sparse vectors have two sets of keys.  The *key domain*, accessed with `sv.keyDomain()`, is the set of all keys which the vector may contain.  This is fixed when the vector object is created.

The *key set*, accessed with `sv.keySet()` as well as `sv.containsKey()` and `sv.size()`, is the set of keys that the vector actually does map to values.  It is a subset of the key domain.

So when you create a new sparse vector, and don't give it values, the key *domain* contains all the keys you gave it, and the key *set* is empty (as is the vector).  Once you set some values with `set` or `fill`, then the key set is nonempty.

The reason for this design is that a sparse vector is represented internally as a pair of arrays, one of keys and another of values, sorted by key.  This allows fast lookup by binary search (*O(lg n)*) as well as very fast linear algebra operations (*O(n)* for many operations such as dot products).

Requiring the set of possible keys up front means that the vector never has to expand the arrays or reshuffle data to make room for a new key.  Setting or retrieving a value is always *O(lg n)*.  It also allows the same key storage to be shared across multiple vectors in certain cases, reducing memory use and time spent copying data around.  We find it to be a useful tradeoff for the kinds of operations that LensKit uses sparse vectors for.

## Anything else?

Much, much more.

### Bulk operations

You've already seen `fill`, which fills a vector with a value.  There is also a bulk `add`, adding a scalar to every value in the vector:

~~~java
MutableSparseVector msv = MutableSparseVector.create(3, 4, 5);
msv.set(3, 1.0);
msv.set(4, 2.0);
msv.set(5, 1.5);
msv.add(2.0);
assert msv.get(3) == 3.0;
assert msv.get(4) == 4.0;
assert msv.get(5) == 3.5;
~~~

There is also a bulk `multiply(double)` which multiplies every value by a scalar.

Both of these operations leave unset keys unchanged.

Finally, `clear()` unsets all keys (and `unset(long)` unsets a single key).

### Linear algebra operations

Compute values of a single vector:

~~~java
SparseVector sv = ImmutableSparseVector.create(someMap);
sv.sum();    // sum up the values (L_1 norm)
sv.mean();   // arithmetic mean of the values
sv.norm();   // Euclidean length of the vector (L_2 norm)
~~~

Compute dot products between two vectors:

~~~java
SparseVector sv1 = ImmutableSparseVector.create(someMap);
SparseVector sv2 = ImmutableSparseVector.create(someOtherMap);
sv1.dot(sv2);
~~~

The dot product ignores keys that are set in one vector but missing or unset in the other; it is equivalent to treating missing keys as being mapped to 0.

### Pairwise modifications

`MutableSparseVector` also lets you do bulk operations with another vector.  In these operations, it is always the vector that you are calling the method on that is being modified, not the vector you pass as the argument.

Copy values from one vector to another:

~~~java
MutableSparseVector msv = MutableSparseVector.create(3,5,9);
msv.set(otherVector);
~~~

You can do pairwise addition or subtraction, adding every value in `otherVector` to the corresponding value in `msv`:

~~~java
msv.add(otherVector);
msv.subtract(anotherVector);
~~~

And do pairwise multiplication (multiply each value in both `msv` and `otherVector`, storing the result in `msv`, and leaving other keys' values unchanged):

~~~java
msv.multiply(otherVector);
~~~

All of these operations are *O(max(m,n))* where *m* and *n* are the lengths of the two vectors.

## How do I convert between mutable and immutable vectors?

All sparse vectors have a couple of operations for mutable/immutable conversions:

- `immutable()` returns an immutable version of the vector.  If the vector is already immutable, it just returns it; otherwise, it returns an immutable copy.
- `mutableCopy()` returns a mutable copy of the vector.  This is always a copy, so you can freely modify it and be confident that no other code will see those modifications.

There is a third method supported by `MutableSparseVector`: `freeze()`.  This is like `immutable()`, with two important differences:

- It tries to compact the vector.  If there are unset keys in the mutable sparse vector, then those keys are not included in the immutable vector's key domain.  This reduces the storage required by expunging unset keys.
- It tries to reuse value storage.  If there are no unset keys, then the value array from the mutable sparse vector is reused in the immutable one.  This reduces the overhead of creating another array copy.

After a mutable sparse vector has been frozen, it can no longer be used.

It's a common idiom in LensKit to create a mutable vector, populate it and use it to accumulate some results, and then return a frozen version of it.  The freeze operation will either save space in the resulting vector by omitting unset keys, or it will save space and time by re-using the value storage.

~~~java
MutableSparseVector msv = MutableSparseVector.create(lotsaKeys);
/* lots of math to accumulate computation results in msv */
return msv.freeze();
~~~
