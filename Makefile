test:
	npx eslint --color --quiet index.js test.js
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
