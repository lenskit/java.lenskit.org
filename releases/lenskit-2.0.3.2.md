---
title: Release 2.0.3.2
version: 2.0.3.2
milestone: 27
layout: release
---

This is a bugfix for 2.0.3.

-   Report no value rather than NaN from metrics when no test users
    could be used (#issue(401))

-   Don't return NaN from top-N nDCG when user has no recommendations
    (#issue(400))

-   Compute vector means only over common keys in Pearson correlation
    (#issue(404)).

