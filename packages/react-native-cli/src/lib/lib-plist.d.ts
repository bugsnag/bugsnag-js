// Types for the module "plist", since it doesn't ship with them, nor are there any available on Definitely Typed.
// These definitions are not complete, and only specify the parts of the library we interact with.

declare module 'plist' {
  export function parse (str: string): Record<string, unknown>
  export function build (obj: Record<string, unknown>, opts?: { indent?: string, indentSize?: number, offset?: number }): string
}
