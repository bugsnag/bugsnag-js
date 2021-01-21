// Types for the module "xcode", since it doesn't ship with them, nor are there any available on Definitely Typed.
// These definitions are not complete, and only specify the parts of the library we interact with.

declare module 'xcode' {
  export class Project {
    parse (callback: (err?: Error) => void): void

    addBuildPhase (
      filePathsArray: string[],
      buildPhaseType: string,
      comment: string,
      target: string | null,
      optionsOrFolderType: Record<string, string>,
      subfolderPath?: string
    ): { uuid: string, buildPhase: {} }

    writeSync (): string

    hash: { project: { objects: { PBXShellScriptBuildPhase: Record<string, Record<string, unknown>> } } }
    filepath: string
  }

  export function project (path: string): Project
}
