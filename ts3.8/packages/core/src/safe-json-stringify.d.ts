declare module '@bugsnag/safe-json-stringify' {
    export default function stringify(value: any, replacer?: null | ((this: any, key: string, value: any) => any), space?: null | string | number, options?: {
        redactedKeys?: Array<string | RegExp>;
        redactedPaths?: string[];
    }): string;
}
