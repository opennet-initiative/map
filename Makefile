include makefilet-download-ondemand.mk

default: help


help: help-on-map

.PHONY: help-on-map
help-on-map:
	@echo "on-map packaging targets:"
	@echo "    style"
	@echo


.PHONY: style
style:
	js-beautify static/onimaps.js
