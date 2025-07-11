# `just --list --unsorted`
default:
    @just --list --unsorted

# `npm install`
install:
    npm install

# `npm ci` for CI
install-ci:
    npm ci

# `npm run dev`
dev: install
    npm run dev

# `npm run lint`
lint: install
    npm run lint:fix

# ESLint with JSON output for CI annotations
ci-lint: install-ci
    npm run ci:eslint

# `npm run test:run`
test: install
    npm run test:run

# `npm run ci:prettier`
prettier: install
    npm run ci:prettier

# `npm run ci:typecheck`
typecheck: install
    npm run ci:typecheck

# `npm run build`
build: install
    npm run build

# `npm run lint:fix`
fix: install
    npm run lint:fix

# Run all pre-commit checks
precommit: typecheck fix build test
    @echo "✅ All pre-commit checks passed!"
