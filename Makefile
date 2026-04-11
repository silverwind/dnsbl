node_modules: pnpm-lock.yaml
	pnpm install
	@touch node_modules

lint: node_modules
	pnpm exec eslint-silverwind --color .

.PHONY: lint-fix
lint-fix: node_modules
	pnpm exec eslint-silverwind --color . --fix

.PHONY: test
test: node_modules lint
	pnpm exec vitest

.PHONY: publish
publish: node_modules
	pnpm publish --no-git-checks

.PHONY: update
update: node_modules
	pnpm exec updates -cu
	rm pnpm-lock.yaml
	pnpm install
	@touch node_modules

.PHONY: patch
patch: node_modules test
	pnpm exec versions -R patch package.json
	git push -u --tags origin master

.PHONY: minor
minor: node_modules test
	pnpm exec versions -R minor package.json
	git push -u --tags origin master

.PHONY: major
major: node_modules test
	pnpm exec versions -R major package.json
	git push -u --tags origin master
