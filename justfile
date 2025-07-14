# `just --list --unsorted`
default:
    @just --list --unsorted

# `npm install`
install:
    npm install

# `npm ci`
install-ci:
    npm ci

# `npm run dev`
dev: install
    npm run dev

# `npm run lint`
lint: install
    npm run lint

# `npm run ci:eslint`
eslint-ci: install-ci
    npm run ci:eslint

# `npm run format`
format: install
    npm run format

# `npm run ci:biome`
biome-ci: install-ci
    npm run ci:biome

# `npm run ci:prettier`
prettier-ci: install-ci
    npm run ci:prettier

# `npm run test:run`
test: install
    npm run test:run

# `npm run test:run`
test-ci: install-ci
    npm run test:run

# `npm run ci:typecheck`
typecheck: install
    npm run ci:typecheck

# `npm run ci:typecheck`
typecheck-ci: install-ci
    npm run ci:typecheck

# `npm run build`
build: install
    npm run build

# `npm run build`
build-ci: install-ci
    npm run build

# Run all pre-commit checks
precommit: format lint typecheck build test
    @echo "✅ All pre-commit checks passed!"
