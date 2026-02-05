node_modules: pnpm-lock.yaml
	pnpm install
	@touch node_modules

lint: node_modules
	pnpm exec eslint --color .

.PHONY: test
test: node_modules lint
	pnpm exec vitest

.PHONY: publish
publish: node_modules
	git push -u --tags origin master
	pnpm publish

.PHONY: update
update: node_modules
	pnpm exec updates -cu
	rm pnpm-lock.yaml
	pnpm install
	@touch node_modules

.PHONY: patch
patch: node_modules test
	pnpm exec versions patch package.json pnpm-lock.yaml
	@$(MAKE) --no-print-directory publish

.PHONY: minor
minor: node_modules test
	pnpm exec versions minor package.json pnpm-lock.yaml
	@$(MAKE) --no-print-directory publish

.PHONY: major
major: node_modules test
	pnpm exec versions major package.json pnpm-lock.yaml
	@$(MAKE) --no-print-directory publish
