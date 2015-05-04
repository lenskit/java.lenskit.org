---
title: Command Line Tools
---

# Command Line Tools

[dl]: /download/

The [LensKit binary distribution][dl] contains a command line tool, `lenskit`,
for performing various LensKit operations.  Each operation is exposed as a
subcommand, much like `git` or `hg` uses, with its own manual page:

- [lenskit](./lenskit.1.html) — the main tool
- [lenskit-input-data](./lenskit-input-data.7.html) — how to specify input data
- [lenskit-script-environment](./lenskit-script-environment.7.html) — how to configure the environment for reading LensKit configuration and eval scripts.

## Subcommands

The main LensKit command has several subcommands that do the real work:

- [lenskit-version](./lenskit-version.1.html)
- [lenskit-eval](./lenskit-eval.1.html)
- [lenskit-grain-model](./lenskit-grain-model.1.html)
- [lenskit-predict](./lenskit-predict.1.html)
- [lenskit-recommend](./lenskit-predict.1.html)
- [lenskit-graph](./lenskit-graph.1.html)
- [lenskit-pack-ratings](./lenskit-pack-ratings.1.html)
