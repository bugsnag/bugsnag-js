import jsonStringify from '@bugsnag/safe-json-stringify'
import type { FeatureFlag } from "../common";

type FeatureFlagEventApi = {
  featureFlag: string
  variant?: string
}

interface FeatureFlagDelegate{
  add: (existingFeatures: Array<FeatureFlag | null>, existingFeatureKeys: { [key: string]: number }, name?: string | null, variant?: any ) => void
  merge: (
    existingFeatures: Array<{ name: string; variant?: any } | null>,
    newFeatures: any,
    existingFeatureKeys: { [key: string]: any }
  ) => Array<{ name: string; variant: any }> | undefined
  toEventApi: (featureFlags: Array<FeatureFlag | null>) => FeatureFlagEventApi[]
  clear: (features: (FeatureFlag | null)[], featuresIndex: { [key: string]: number }, name: string) => void
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
    if (!Array.isArray(newFeatures)) {
      return
    }

    for (let i = 0; i < newFeatures.length; ++i) {
      const feature = newFeatures[i]

      if (feature === null || typeof feature !== 'object') {
        continue
      }

      // 'add' will handle if 'name' doesn't exist & 'variant' is optional
      featureFlagDelegate.add(existingFeatures, existingFeatureKeys, feature.name, feature.variant)
    }

    // Remove any nulls from the array to match the return type
    return existingFeatures.filter(f => f) as Array<{ name: string; variant: any }>
  },

// convert feature flags from a map of 'name -> variant' into the format required
// by the Bugsnag Event API:
//   [{ featureFlag: 'name', variant: 'variant' }, { featureFlag: 'name 2' }]
  toEventApi: (featureFlags) => {
    return (featureFlags || [])
      .filter((flag): flag is FeatureFlag => flag !== null && typeof flag === 'object')
      .map((flag) => {
        const result: FeatureFlagEventApi = { featureFlag: flag.name };
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