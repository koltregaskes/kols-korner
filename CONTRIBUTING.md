# Contributing

Thanks for helping with `kols-korner`.

## Principles

- keep the public boundary strict
- keep the build static-first and dependency-light
- prefer clear editorial quality over noisy automation
- do not commit secrets, machine-local paths, or private workspace notes

## Workflow

1. update or add the relevant markdown content under `content/`
2. run `node scripts/build.mjs` to regenerate `site/`
3. verify the public site renders the intended changes
4. commit only the intended scope

## Pull requests

- explain what changed (content, design, build, or infra)
- call out any privacy-boundary changes explicitly
- include the exact verification commands you ran
