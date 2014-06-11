---
title: Downloads
version: 2.0.5
betaVersion: 2.1-M4
betaTarget: 2.1
baseUrl: http://files.grouplens.org/lenskit/releases
---

# Download LensKit

[release notes]: ../maven-site/releases/

The latest version of LensKit is {{version}}.  For an
overview of changes in this release, see the
[release notes][].

[bin.zip]: {{baseUrl}}/lenskit-{{version}}.zip
[bin.tgz]: {{baseUrl}}/lenskit-{{version}}.tar.gz
[source.zip]: {{baseUrl}}/lenskit-{{version}}-source.zip
[source.tgz]: {{baseUrl}}/lenskit-{{version}}-source.tar.gz

- [Binary archive][bin.tgz] (also available as a [zip file][bin.zip]) — contains LensKit JAR files, all dependencies, and scripts to run the LensKit evaluator.

- [Source archive][source.tgz] (also available as a [zip file][source.zip]).

## Using Maven

If you  want to use LensKit  within another Java project,  there is no
need to download anything — LensKit  is published to Maven Central, so
just add  it as a  dependency in  Maven, Ivy, or  use it via  a Groovy
Grape.  This is the recommended way to integrate LensKit as a library.

~~~~ xml
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <artifactId>lenskit-core</artifactId>
  <version>{{version}}</version>
</dependency>
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <!-- replace with the appropriate algorithm module -->
  <artifactId>lenskit-knn</artifactId>
  <version>{{version}}</version>
</dependency>
~~~~

{{#betaVersion}}
## Prerelease Version

LensKit {{betaTarget}} is currently under development.  If you want to use it without tracking {{betaTarget}}-SNAPSHOT or Git `master`, you can use version {{betaVersion}}:

[beta.bin.zip]: {{baseUrl}}/lenskit-{{betaVersion}}.zip
[beta.bin.tgz]: {{baseUrl}}/lenskit-{{betaVersion}}.tar.gz
[beta.source.zip]: {{baseUrl}}/lenskit-{{betaVersion}}-source.zip
[beta.source.tgz]: {{baseUrl}}/lenskit-{{betaVersion}}-source.tar.gz

- [Binary archive][beta.bin.tgz] (also available as a [zip file][beta.bin.zip])

- [Source archive][beta.source.tgz] (also available as a [zip file][beta.source.zip])

LensKit {{betaVersion}} has also been pushed to Maven Central, so you can depend on it like a released version.

{{/betaVersion}}

## Developing LensKit

[GH]: https://github.com/grouplens/lenskit
[ML]: https://wwws.cs.umn.edu/mm-cs/listinfo/lenskit

The latest development sources for LensKit are in our
[Git repository][GH] (hosted on GitHub).  The README contains
documentation on how to start using the source code with various IDEs.

We welcome patch submissions for LensKit. To submit a patch, just fork
the repository on GitHub, prepare your changes, and send a pull
request.  We also encourage you to discuss your proposed changes on the
LensKit [mailing list][ml].
