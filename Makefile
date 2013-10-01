JRUBY_ZIPFILE = jruby-bin-1.7.4.zip
JRUBY_DIR = jruby-1.7.4
JRUBY_URL = http://jruby.org.s3.amazonaws.com/downloads/1.7.4/$(JRUBY_ZIPFILE)

-include local.cfg

DEPLOY_PATH ?= $(error No deploy path specified)

ifdef DEPLOY_HOST
DEPLOY_TARGET ?= $(DEPLOY_HOST):$(DEPLOY_PATH)
else
DEPLOY_TARGET ?= $(DEPLOY_PATH)
endif

JRUBY = ./$(JRUBY_DIR)/bin/jruby
BUNDLE = ./$(JRUBY_DIR)/bin/bundle
NANOC = ./bin/nanoc

.PHONY: build bootstrap prune deploy clean very-clean

build: bootstrap
	$(JRUBY) $(NANOC) compile

bootstrap: $(NANOC)

$(JRUBY_ZIPFILE):
	wget -O $(JRUBY_ZIPFILE) $(JRUBY_URL)

$(JRUBY): $(JRUBY_ZIPFILE)
	@echo "Verifying $(JRUBY_ZIPFILE)."
	@echo "If this command fails, delete the file and try again."
	shasum -c jruby.sha
	unzip -u $(JRUBY_ZIPFILE)
	touch $(JRUBY)

$(BUNDLE): $(JRUBY)
	$(JRUBY) $(JRUBY_DIR)/bin/gem install bundler

$(NANOC): $(BUNDLE) Gemfile
	$(JRUBY) $(BUNDLE) install

prune:
	$(JRUBY) $(NANOC) prune

deploy: build
	rsync -vrp --chmod=Dg+s,ug+w,Fo-w,+X output/ $(DEPLOY_TARGET)

clean:
	rm -rf output tmp
	rm -f crash.log

very-clean: clean	
	rm -rf bin gems
	rm -rf $(JRUBY_DIR)
