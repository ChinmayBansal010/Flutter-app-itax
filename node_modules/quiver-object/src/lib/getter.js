export const defineGetter = (object, field, value) => {
  Object.defineProperty(object, field, {
    get: () => value
  })
}