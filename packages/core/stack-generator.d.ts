declare module 'stack-generator' {
  interface StackFrame {
    functionName?: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
  }
  
  interface BacktraceOptions {
    maxStackSize?: number;
  }
  
  export function backtrace(options?: BacktraceOptions): StackFrame[];
  
  // Default export
  const StackGenerator: {
    backtrace(options?: BacktraceOptions): StackFrame[];
  };
  
  export default StackGenerator;
}
