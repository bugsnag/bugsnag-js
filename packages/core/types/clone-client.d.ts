import Client from './client'
import { Config } from './common'

type OnCloneCallback <T extends Config> = (client: Client<T>) => void
declare function cloneClient <T extends Config>(client: Client<T>): Client<T>

declare namespace cloneClient {
    export function registerCallback <T extends Config> (callback: OnCloneCallback<T>): void
}

export default cloneClient
