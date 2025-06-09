import filter from './es-utils/filter'
import isArray from './es-utils/is-array'
import jsonStringify from '@bugsnag/safe-json-stringify'
import {FeatureFlag} from "../common";

interface FeatureFlagDelegate{
  add: (existingFeatures: Array<FeatureFlag | null>, existingFeatureKeys: { [key: string]: unknown }, name?: unknown, variant?: any ) => void
  merge: (
    existingFeatures: Array<{ name: string; variant?: any } | null>,
    newFeatures: any,
    existingFeatureKeys: { [key: string]: any }
  ) => Array<{ name: string; variant: any }> | undefined
  toEventApi: (featureFlags: Array<FeatureFlag | null>) => unknown[]
  clear: (features: any, featuresIndex: any, name: any) => any
}

const featureFlagDelegate: FeatureFlagDelegate = {
  add: (existingFeatures, existingFeatureKeys, name, variant) => {
    if (typeof name !== 'string') {
      return
    }

    if (variant === undefined) {
      variant = null
    } else if (variant !== null && typeof variant !== 'string') {
      variant = jsonStringify(variant)
    }

    const existingIndex = existingFeatureKeys[name]
    if (typeof existingIndex === 'number') {
      existingFeatures[existingIndex] = {name, variant}
      return
    }

    existingFeatures.push({name, variant})
    existingFeatureKeys[name] = existingFeatures.length - 1
  },

  merge: (existingFeatures, newFeatures, existingFeatureKeys) => {
    if (!isArray(newFeatures)) {
      return
    }

    for (let i = 0; i < newFeatures.length; ++i) {
      const feature = newFeatures[i]

      if (!feature || typeof feature !== 'object' || typeof feature.name !== 'string') {
        continue
      }

      featureFlagDelegate.add(existingFeatures, existingFeatureKeys, feature.name, feature.variant)
    }

    // Remove any nulls from the array to match the return type
    return existingFeatures.filter(f => f && typeof f.name === 'string') as Array<{ name: string; variant: any }>
  },

// convert feature flags from a map of 'name -> variant' into the format required
// by the Bugsnag Event API:
//   [{ featureFlag: 'name', variant: 'variant' }, { featureFlag: 'name 2' }]
  toEventApi: (featureFlags) => {
    return (featureFlags || [])
      .filter((flag): flag is FeatureFlag => flag !== null && typeof flag === 'object' && typeof (flag as FeatureFlag).name === 'string')
      .map((flag) => {
        const result: { featureFlag: string; variant?: string } = { featureFlag: flag.name };
        if (typeof flag.variant === 'string') {
          result.variant = flag.variant;
        }
        return result;
      });
  },

  clear: (features, featuresIndex, name) => {
    const existingIndex = featuresIndex[name]
    if (typeof existingIndex === 'number') {
      features[existingIndex] = null
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete featuresIndex[name]
    }
  }
}

export default featureFlagDelegate
