---
title: Downloads
---

# Download LensKit

[release notes]: maven-site/release-notes.html

The latest version of LensKit is {{lenskit.version}}.  For an
overview of changes in this release, see the
[release notes][].  All downloads are hosted on [Bintray](https://bintray.com/grouplens/lenskit-releases/lenskit/{{lenskit.version}}/general).

[source.zip]: https://github.com/grouplens/lenskit/archive/lenskit-{{lenskit.version}}.zip
[source.tgz]: https://github.com/grouplens/lenskit/archive/lenskit-{{lenskit.version}}.tar.gz

- [Binary archive]({{lenskit.downloads}}/lenskit-{{lenskit.version}}.tar.gz) (also
  available as a [zip file]({{lenskit.downloads}}/lenskit-{{lenskit.version}}.zip)) —
  contains LensKit JAR files, all dependencies, and scripts to run the
  LensKit evaluator.

- [Source archive][source.tgz] (also available as a
  [zip file][source.zip]).

## Using Maven

If you  want to use LensKit  within another Java project,  there is no
need to download anything — LensKit  is published to Maven Central, so
just add  it as a  dependency in  Maven, Ivy, or  use it via  a Groovy
Grape.  This is the recommended way to integrate LensKit as a library.

~~~~ xml
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <artifactId>lenskit-core</artifactId>
  <version>{{lenskit.version}}</version>
</dependency>
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <!-- replace with the appropriate algorithm module -->
  <artifactId>lenskit-knn</artifactId>
  <version>{{lenskit.version}}</version>
</dependency>
~~~~

## Developing LensKit

[BB]: https://bitbucket.org/grouplens/lenskit
[README]: https://bitbucket.org/grouplens/lenskit/overview
[ML]: https://wwws.cs.umn.edu/mm-cs/listinfo/lenskit

The latest development sources for LensKit are in our
[Mercurial repository][BB] (hosted on BitBucket).  The [README][]
contains documentation on how to start using the source code with
various IDEs.

We welcome patch submissions for LensKit. To submit a patch, just fork
the repository on BitBucket, prepare your changes, and send a pull
request.  We also encourage you to discuss your proposed changes on the
LensKit [mailing list][ml].
