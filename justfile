# `just --list --unsorted`
default:
    @just --list --unsorted

# `npm run ci:typecheck`
typecheck:
    npm run ci:typecheck

# `npm run ci:prettier`
prettier:
    npm run ci:prettier

# `npm run ci:eslint`
eslint:
    npm run ci:eslint

# `npm run build`
build:
    npm run build

# `npm run lint:fix`
fix:
    npm run lint:fix

# `npm run test:run`
test:
    npm run test:run

# Run development server
dev:
    npm run dev

# Preview production build
preview:
    npm run preview

# Run all pre-commit checks
precommit: typecheck fix build test
    @echo "✅ All pre-commit checks passed!"
