test:
	npx eslint --color --quiet src/index.cjs
	npx eslint --color --quiet src/index.mjs
	npx ava
	
publish:
	git push -u --tags origin master
	npm publish

deps:
	rm -rf node_modules
	npm i

update:
	npx updates -cu
	$(MAKE) deps

patch:
	$(MAKE) test
	npx ver -C patch
	$(MAKE) publish

minor:
	$(MAKE) test
	npx ver -C minor
	$(MAKE) publish

major:
	$(MAKE) test
	npx ver -C major
	$(MAKE) publish
