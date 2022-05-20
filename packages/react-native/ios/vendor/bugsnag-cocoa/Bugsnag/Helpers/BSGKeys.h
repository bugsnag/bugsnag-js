//
//  BSGKeys.h
//  Bugsnag
//
//  Created by Jamie Lynch on 24/10/2017.
//  Copyright © 2017 Bugsnag. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NSString * BSGKey NS_TYPED_ENUM;

/*
 * These constants are declared with static storage to prevent bloating the
 * symbol and export tables. String pooling means the compiler won't create
 * multiple copies of the same string in the output.
 */

static BSGKey const BSGKeyAction                    = @"action";
static BSGKey const BSGKeyApiKey                    = @"apiKey";
static BSGKey const BSGKeyApp                       = @"app";
static BSGKey const BSGKeyAppType                   = @"appType";
static BSGKey const BSGKeyAppVersion                = @"appVersion";
static BSGKey const BSGKeyAttributes                = @"attributes";
static BSGKey const BSGKeyAutoDetectErrors          = @"autoDetectErrors";
static BSGKey const BSGKeyAutoTrackSessions         = @"autoTrackSessions";
static BSGKey const BSGKeyBatteryLevel              = @"batteryLevel";
static BSGKey const BSGKeyBreadcrumbs               = @"breadcrumbs";
static BSGKey const BSGKeyBundleVersion             = @"bundleVersion";
static BSGKey const BSGKeyCharging                  = @"charging";
static BSGKey const BSGKeyClient                    = @"client";
static BSGKey const BSGKeyCodeBundleId              = @"codeBundleId";
static BSGKey const BSGKeyConfig                    = @"config";
static BSGKey const BSGKeyContext                   = @"context";
static BSGKey const BSGKeyCppException              = @"cpp_exception";
static BSGKey const BSGKeyDevelopment               = @"development";
static BSGKey const BSGKeyDevice                    = @"device";
static BSGKey const BSGKeyEmail                     = @"email";
static BSGKey const BSGKeyEnabledReleaseStages      = @"enabledReleaseStages";
static BSGKey const BSGKeyEndpoints                 = @"endpoints";
static BSGKey const BSGKeyError                     = @"error";
static BSGKey const BSGKeyErrorClass                = @"errorClass";
static BSGKey const BSGKeyEvents                    = @"events";
static BSGKey const BSGKeyException                 = @"exception";
static BSGKey const BSGKeyExceptionName             = @"exception_name";
static BSGKey const BSGKeyExceptions                = @"exceptions";
static BSGKey const BSGKeyExtraRuntimeInfo          = @"extraRuntimeInfo";
static BSGKey const BSGKeyFeatureFlag               = @"featureFlag";
static BSGKey const BSGKeyFeatureFlags              = @"featureFlags";
static BSGKey const BSGKeyFrameAddress              = @"frameAddress";
static BSGKey const BSGKeyGroupingHash              = @"groupingHash";
static BSGKey const BSGKeyHandled                   = @"handled";
static BSGKey const BSGKeyHandledCount              = @"handledCount";
static BSGKey const BSGKeyId                        = @"id";
static BSGKey const BSGKeyImageAddress              = @"image_addr";
static BSGKey const BSGKeyImageVmAddress            = @"image_vmaddr";
static BSGKey const BSGKeyIncomplete                = @"incomplete";
static BSGKey const BSGKeyInfo                      = @"info";
static BSGKey const BSGKeyInstructionAddress        = @"instruction_addr";
static BSGKey const BSGKeyIsLaunching               = @"isLaunching";
static BSGKey const BSGKeyIsLR                      = @"isLR";
static BSGKey const BSGKeyIsPC                      = @"isPC";
static BSGKey const BSGKeyLabel                     = @"label";
static BSGKey const BSGKeyLogLevel                  = @"logLevel";
static BSGKey const BSGKeyLowMemoryWarning          = @"lowMemoryWarning";
static BSGKey const BSGKeyMach                      = @"mach";
static BSGKey const BSGKeyMachoFile                 = @"machoFile";
static BSGKey const BSGKeyMachoLoadAddr             = @"machoLoadAddress";
static BSGKey const BSGKeyMachoUUID                 = @"machoUUID";
static BSGKey const BSGKeyMachoVMAddress            = @"machoVMAddress";
static BSGKey const BSGKeyMaxBreadcrumbs            = @"maxBreadcrumbs";
static BSGKey const BSGKeyMaxPersistedEvents        = @"maxPersistedEvents";
static BSGKey const BSGKeyMaxPersistedSessions      = @"maxPersistedSessions";
static BSGKey const BSGKeyMessage                   = @"message";
static BSGKey const BSGKeyMetadata                  = @"metaData";
static BSGKey const BSGKeyMethod                    = @"method";
static BSGKey const BSGKeyName                      = @"name";
static BSGKey const BSGKeyNotifier                  = @"notifier";
static BSGKey const BSGKeyNotifyEndpoint            = @"notify";
static BSGKey const BSGKeyObjectAddress             = @"object_addr";
static BSGKey const BSGKeyObjectName                = @"object_name";
static BSGKey const BSGKeyOrientation               = @"orientation";
static BSGKey const BSGKeyOsVersion                 = @"osVersion";
static BSGKey const BSGKeyPayloadVersion            = @"payloadVersion";
static BSGKey const BSGKeyPersistUser               = @"persistUser";
static BSGKey const BSGKeyProduction                = @"production";
static BSGKey const BSGKeyReason                    = @"reason";
static BSGKey const BSGKeyRedactedKeys              = @"redactedKeys";
static BSGKey const BSGKeyReleaseStage              = @"releaseStage";
static BSGKey const BSGKeySendThreads               = @"sendThreads";
static BSGKey const BSGKeySession                   = @"session";
static BSGKey const BSGKeySessions                  = @"sessions";
static BSGKey const BSGKeySessionsEndpoint          = @"sessions";
static BSGKey const BSGKeySeverity                  = @"severity";
static BSGKey const BSGKeySeverityReason            = @"severityReason";
static BSGKey const BSGKeySignal                    = @"signal";
static BSGKey const BSGKeyStacktrace                = @"stacktrace";
static BSGKey const BSGKeyStartedAt                 = @"startedAt";
static BSGKey const BSGKeySymbolAddr                = @"symbolAddress";
static BSGKey const BSGKeySymbolAddress             = @"symbol_addr";
static BSGKey const BSGKeySymbolName                = @"symbol_name";
static BSGKey const BSGKeySystem                    = @"system";
static BSGKey const BSGKeyThermalState              = @"thermalState";
static BSGKey const BSGKeyThreads                   = @"threads";
static BSGKey const BSGKeyTimestamp                 = @"timestamp";
static BSGKey const BSGKeyType                      = @"type";
static BSGKey const BSGKeyUnhandled                 = @"unhandled";
static BSGKey const BSGKeyUnhandledCount            = @"unhandledCount";
static BSGKey const BSGKeyUnhandledOverridden       = @"unhandledOverridden";
static BSGKey const BSGKeyUrl                       = @"url";
static BSGKey const BSGKeyUser                      = @"user";
static BSGKey const BSGKeyUuid                      = @"uuid";
static BSGKey const BSGKeyVariant                   = @"variant";
static BSGKey const BSGKeyVersion                   = @"version";
static BSGKey const BSGKeyWarning                   = @"warning";

#define BSGKeyHwCputype "hw.cputype"
#define BSGKeyHwCpusubtype "hw.cpusubtype"
#define BSGKeyDefaultMacName "en0"
