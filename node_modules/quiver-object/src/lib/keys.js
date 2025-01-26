export function* ownKeys(object) {
  yield* Object.getOwnPropertyNames(object)
  yield* Object.getOwnPropertySymbols(object)
}