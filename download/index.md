---
title: Downloads
layout: default
priority: 1
changefreq: weekly
---

# Download LensKit

[release notes]: /releases/lenskit-{{site.data.lenskit.version}}.html

The latest version of LensKit is {{site.data.lenskit.version}}.  For an
overview of changes in this release, see the
[release notes][].

[bin.zip]: {{site.data.lenskit.downloadUrl}}/lenskit-{{site.data.lenskit.version}}.zip
[bin.tgz]: {{site.data.lenskit.downloadUrl}}/lenskit-{{site.data.lenskit.version}}.tar.gz
[source]: https://github.com/lenskit/lenskit/releases/tag/lenskit-{{site.data.lenskit.version}}
[BinTray]: https://bintray.com/lenskit/lenskit-releases/lenskit/{{site.data.lenskit.version}}/view

- [Binary archive][bin.zip] —
  contains LensKit JAR files, all dependencies, and scripts to run the LensKit
  evaluator.  LensKit binaries are hosted on [BinTray][].
- Get the source from [GitHub][source].

## Using Maven

If you  want to use LensKit  within another Java project,  there is no
need to download anything — LensKit  is published to Maven Central, so
just add  it as a  dependency in  Maven, Ivy, or  use it via  a Groovy
Grape.  This is the recommended way to integrate LensKit as a library.

~~~xml
<dependency>
  <groupId>org.grouplens.lenskit</groupId>
  <artifactId>lenskit-all</artifactId>
  <version>{{site.data.lenskit.version}}</version>
</dependency>
~~~

{% if site.data.lenskit.prerelease %}
## Prerelease Version {#prerelease}

LensKit {{site.data.lenskit.next}} is currently under development.  If you want to use it without tracking {{site.data.lenskit.next}}-SNAPSHOT or Git `master`, you can use version {{site.data.lenskit.prerelease}}:

[beta.bin.zip]: https://github.com/lenskit/lenskit/releases/download/lenskit-{{site.data.lenskit.prerelease}}/lenskit-{{site.data.lenskit.prelease}}.zip
[beta.tag]: https://github.com/lenskit/lenskit/releases/lenskit-{{site.data.lenskit.prerelease}}

- [Binary archive][beta.bin.zip]
- [Additional downloads][beta.tag]

LensKit {{site.data.lenskit.prerelease}} has also been pushed to Maven Central, so you can depend on it like a released version.

You may also want to consult the [release notes](../releases/lenskit-{{site.data.lenskit.next}}); note that they are likely incomplete.

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
