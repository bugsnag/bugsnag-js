export function reduce<T, U>(arr: T[], fn: (accum: any, item: T) => any, accum: any): any

export function map<T, U>(arr: T[], fn: (item: T) => U): U[]

export function filter<T>(arr: T[], fn: (item: T) => boolean): T[]

export function keys(obj: {}): string[]

export function isArray(obj: any): boolean

export function includes<T>(arr: T[], item: T): boolean
