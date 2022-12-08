// @flow
import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getMessage(a: string): Promise<string>;
}
export default (TurboModuleRegistry.get<Spec>(
  'MazeRunner'
): ?Spec);
