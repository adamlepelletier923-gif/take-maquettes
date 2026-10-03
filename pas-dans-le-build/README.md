# Pre-build omissions report

This static French page lists open mobile proposals, staging feature settings, and outstanding people/device steps. It is a timestamped report, not permission to build or merge.

From a clean `take-maquettes` checkout on `main`, refresh and publish in one command:

```sh
bun pas-dans-le-build/refresh.mjs --publish
```

Requirements: Bun with `Bun.JSONC.parse` (the Take-pinned Bun 1.4 works), Git, curl, an authenticated `gh` with read access to `TakeAppAIOrg/take-app` and push access to this Pages repository. No packages are installed. No build, browser or mobile device is started. Credentials are handled by `gh` and never included in the report.

Without `--publish`, the command only regenerates this directory's `index.html` and `snapshot.json`. Publishing first fast-forwards a clean checkout, then commits and pushes only the generated files. It never merges a Take pull request.

## Freshness and evidence

- All open proposals, including drafts and proposals based on another feature branch, and all of their changed files are paginated. Reviewed scope/wording is in `catalog.json`. New relevant proposals remain visible with a description warning; they are never silently treated as reviewed.
- Reasons tied to a proposal head are discarded when that head changes. Check state is read from the exact head, separately from human review.
- The source defaults and every `apps/api/wrangler.staging-*.jsonc` file are read at one captured `main` commit. The effective public capabilities come from a fresh `GET https://api-staging.take.cc/config`.
- If `main` moves during collection, the script repeats the collection; after three changes it stops without replacing the report.
- Internal defaults absent from the public response are explicitly unconfirmed; they are not claimed as runtime-observed absences.
- The report publishes only selected descriptions, boolean settings, status and source references. It never publishes raw PR bodies/comments, local memory, private messages, media, credentials or Wrangler configuration files.

Update `catalog.json` when a feature is new or its reviewed explanation changes. The command refreshes state deterministically; it does not invent user impact or decisions. Unknown reasons remain explicit. Read the warnings before starting a build.

Page: https://adamlepelletier923-gif.github.io/take-maquettes/pas-dans-le-build/
