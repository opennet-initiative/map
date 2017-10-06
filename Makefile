include makefilet-download-ondemand.mk

default: help


help: help-on-map

.PHONY: help-on-map
help-on-map:
	@echo "on-map packaging targets:"
	@echo "    deploy-deb-remote"
	@echo "    style"
	@echo


.PHONY: style
style:
	js-beautify static/onimaps.js


.PHONY: deploy-deb-remote
deploy-deb-remote: dist-deb-packages-directory
	@if [ -z "$(DEPLOY_TARGET)" ]; then \
		echo >&2 "Missing 'DEPLOY_TARGET' environment variable (e.g. 'root@jun.on')."; \
		exit 1; fi
	scp "$(DIR_DEBIAN_SIMPLIFIED_PACKAGE_FILES)"/*.deb "$(DEPLOY_TARGET):/tmp/"
	ssh "$(DEPLOY_TARGET)" \
		'for fname in on-map; do \
			dpkg -i "/tmp/$$fname.deb" && rm "/tmp/$$fname.deb" || exit 1; done'
