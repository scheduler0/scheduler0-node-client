# Scheduler0 Node client — release automation
#
# Usage:
#   make test                  Run the test suite
#   make build                 Compile TypeScript to dist/
#   make release VERSION=1.0.1 Bump version, publish to npm, tag & push
#
# Assumes npm auth is configured (npm login, or an NPM_TOKEN in ~/.npmrc).
# The package is scoped (@scheduler0/...) and published with public access
# via "publishConfig" in package.json.

MAIN_BRANCH := main

.PHONY: help install test build clean release \
        guard-VERSION check-clean check-branch check-tag

help:
	@echo "make test                  - run the test suite"
	@echo "make build                 - compile TypeScript to dist/"
	@echo "make release VERSION=1.0.1 - bump, publish to npm, tag & push"

install:
	npm ci

test:
	npm test

clean:
	rm -rf dist

build:
	npm run build

release: guard-VERSION check-branch check-clean check-tag test build
	@echo ">> Releasing @scheduler0/scheduler0-node-client v$(VERSION)"
	# npm version updates package.json, commits, and creates the v$(VERSION) tag
	npm version $(VERSION) -m "Release v%s"
	# npm publish runs prepublishOnly (build) again, then uploads
	npm publish
	git push origin $(MAIN_BRANCH)
	git push origin v$(VERSION)
	@echo ">> Published $(VERSION) to npm and pushed tag v$(VERSION)"

# --- guards -----------------------------------------------------------------

guard-VERSION:
	@if [ -z "$(VERSION)" ]; then echo "ERROR: VERSION is required, e.g. make release VERSION=1.0.1"; exit 1; fi
	@echo "$(VERSION)" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-.*)?$$' || { echo "ERROR: VERSION '$(VERSION)' is not a valid semver (expected x.y.z)"; exit 1; }

check-branch:
	@if [ "$$(git branch --show-current)" != "$(MAIN_BRANCH)" ]; then echo "ERROR: not on '$(MAIN_BRANCH)' branch"; exit 1; fi

check-clean:
	@if [ -n "$$(git status --porcelain)" ]; then echo "ERROR: working tree is dirty; commit or stash first"; exit 1; fi

check-tag:
	@if git rev-parse -q --verify "refs/tags/v$(VERSION)" >/dev/null; then echo "ERROR: tag v$(VERSION) already exists"; exit 1; fi
