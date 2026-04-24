// TypeScript 4.8.4 doesn't include Symbol.asyncDispose from ES2023
// This declaration provides the missing symbol for compatibility with Rollup types
declare global {
  interface SymbolConstructor {
    readonly asyncDispose: unique symbol;
  }
}

export {};