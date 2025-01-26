import { ownKeys } from './keys'

export const mixin = (target, mixin) => {
  for(let key of ownKeys(mixin)) {
    const descriptor = Object.getOwnPropertyDescriptor(mixin, key)
    Object.defineProperty(target, key, descriptor)
  }
}
