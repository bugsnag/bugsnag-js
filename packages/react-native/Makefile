upgrade_vendor:
ifeq ($(IOS_VERSION),)
	@$(error IOS_VERSION is not defined. Run with `make IOS_VERSION=number upgrade_vendor`)
endif
	@git -C ../../../bugsnag-cocoa fetch
	@git -C ../../../bugsnag-cocoa checkout v$(IOS_VERSION)
	@rsync --delete -al ../../../bugsnag-cocoa/UPGRADING.md ios/vendor/bugsnag-cocoa/UPGRADING.md
	@rsync --delete -al ../../../bugsnag-cocoa/CHANGELOG.md ios/vendor/bugsnag-cocoa/CHANGELOG.md
	@rsync --delete -al ../../../bugsnag-cocoa/README.md ios/vendor/bugsnag-cocoa/README.md
	@rsync --delete -al ../../../bugsnag-cocoa/Source/ ios/vendor/bugsnag-cocoa/Source/
	@rsync --delete -al ../../../bugsnag-cocoa/Configurations/ ios/vendor/bugsnag-cocoa/Configurations/
	@rsync --delete -al ../../../bugsnag-cocoa/iOS/ ios/vendor/bugsnag-cocoa/iOS/
	@rsync --delete -al ../../../bugsnag-cocoa/Source/BSG_KSCrashReportWriter.h ios/Bugsnag/
	@rsync --delete -al ../../../bugsnag-cocoa/Source/Bugsnag{,Metadata,Configuration,Breadcrumb,Event,Plugin}.h ios/Bugsnag/
	@git status
