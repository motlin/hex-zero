# `just --list --unsorted`
default:
    @just --list --unsorted

# `npm run ci:typecheck`
typecheck: install
    npm run ci:typecheck

# `npm run ci:prettier`
prettier: install
    npm run ci:prettier

# `npm run ci:eslint`
eslint: install
    npm run ci:eslint

# `npm run build`
build: install
    npm run build

# `npm run lint:fix`
fix: install
    npm run lint:fix

# `npm run test:run`
test: install
    npm run test:run

# Run development server
dev: install
    npm run dev

# Install dependencies
install:
    npm install

# Preview production build
preview: install
    npm run preview

# Run all pre-commit checks
precommit: typecheck fix build test
    @echo "✅ All pre-commit checks passed!"
