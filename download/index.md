---
title: Downloads
layout: default
---

# Download LensKit

[release notes]: /releases/lenskit-{{site.lenskit.version}}.html

The latest version of LensKit is {{site.lenskit.version}}.  For an
overview of changes in this release, see the
[release notes][].

[bin.zip]: {{site.lenskit.downloadUrl}}/lenskit-{{site.lenskit.version}}.zip
[bin.tgz]: {{site.lenskit.downloadUrl}}/lenskit-{{site.lenskit.version}}.tar.gz
[source]: https://github.com/lenskit/lenskit/releases/tag/lenskit-{{site.lenskit.version}}
[BinTray]: https://bintray.com/lenskit/lenskit-releases/lenskit/{{site.lenskit.version}}/view

- [Binary archive][bin.tgz] (also available as a [zip file][bin.zip]) —
  contains LensKit JAR files, all dependencies, and scripts to run the LensKit
  evaluator.  LensKit binaries are hosted on [BinTray][].
- Get the source from [GitHub][source].

## Using Maven

If you  want to use LensKit  within another Java project,  there is no
need to download anything — LensKit  is published to Maven Central, so
just add  it as a  dependency in  Maven, Ivy, or  use it via  a Groovy
Grape.  This is the recommended way to integrate LensKit as a library.

```xml
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <artifactId>lenskit-core</artifactId>
  <version>{{site.lenskit.version}}</version>
</dependency>
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <!-- replace with the appropriate algorithm module -->
  <artifactId>lenskit-knn</artifactId>
  <version>{{site.lenskit.version}}</version>
</dependency>
```

{% if site.lenskit.prerelease %}
## Prerelease Version {#prerelease}

LensKit {{site.lenskit.next}} is currently under development.  If you want to use it without tracking {{site.lenskit.next}}-SNAPSHOT or Git `master`, you can use version {{site.lenskit.prerelease}}:

[beta.bin.zip]: {{site.lenskit.downloadUrl}}/lenskit-{{site.lenskit.prerelease}}.zip
[beta.bin.tgz]: {{site.lenskit.downloadUrl}}/lenskit-{{site.lenskit.prerelease}}.tar.gz
[beta.source.zip]: {{site.lenskit.downloadUrl}}/lenskit-{{site.lenskit.prerelease}}-source.zip
[beta.source.tgz]: {{site.lenskit.downloadUrl}}/lenskit-{{site.lenskit.prerelease}}-source.tar.gz

- [Binary archive][beta.bin.tgz] (also available as a [zip file][beta.bin.zip])
- [Source archive][beta.source.tgz] (also available as a [zip file][beta.source.zip])

LensKit {{site.lenskit.prerelease}} has also been pushed to Maven Central, so you can depend on it like a released version.

You may also want to consult the [release notes](../releases/lenskit-{{site.lenskit.next}}); note that they are likely incomplete.

{% endif %}

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
