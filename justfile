# `just --list --unsorted`
default:
    @just --list --unsorted

# `npm install`
install:
    npm install

# `npm ci`
ci-install:
    npm ci

# `npm run dev`
dev: install
    npm run dev

# `npm run lint`
lint: install
    npm run lint

# `npm run ci:eslint`
ci-eslint: ci-install
    npm run ci:eslint

# `npm run format`
format: install
    npm run format

# `npm run ci:biome`
ci-biome: ci-install
    npm run ci:biome

# `npm run ci:prettier`
ci-prettier: ci-install
    npm run ci:prettier

# `npm run test:run`
test: install
    npm run test:run

# `npm run test:run`
ci-test: ci-install
    npm run test:run

# `npm run typecheck`
typecheck: install
    npm run typecheck

# `npm run typecheck`
ci-typecheck: ci-install
    npm run typecheck

# `npm run build`
build: install
    npm run build

# `npm run build`
ci-build: ci-install
    npm run build

# Run all pre-commit checks
precommit: format lint typecheck build test
    @echo "✅ All pre-commit checks passed!"
