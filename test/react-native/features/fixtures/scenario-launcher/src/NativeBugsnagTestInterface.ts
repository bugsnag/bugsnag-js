import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  startBugsnag(options: UnsafeObject): Promise<void>
  runScenario(scenario: string): Promise<void>
  clearPersistentData(): void
}

export default TurboModuleRegistry.get<Spec>('BugsnagTestInterface') as Spec | null
