import { ownKeys } from './keys'

const defaultProto = Object.getPrototypeOf({})

const noCopyKey = Symbol('noCopy')

const shouldNotCopy = object =>
  object[noCopyKey] == true

export const copy = (object, options={}) => {
  const { forceCopy=false, excludeFields } = options

  if((object == null) || (typeof(object) != 'object')) {
    return object
  }

  if(shouldNotCopy(object) && !forceCopy) {
    return object
  }

  if(Array.isArray(object)) {
    return copyArray(object)
  }

  /*
   * We don't perform copy on the object if it is not a plain object,
   * i.e. has a different prototype than the default one.
   *
   * The evaluation is the same as
   *  Object.getPrototypeOf(object) === Object.getPrototypeOf({})
   * Except that we cache the default prototype in the constiable defaultProto.
   *
   * This works because all objects created through the hash literal
   * or new Object() all shares the same prototype.
   */
  const proto = Object.getPrototypeOf(object)
  if(proto !==  defaultProto && proto != null) {
    return object
  }

  if(excludeFields) {
    return copyPlainObjectWithExcludes(object, excludeFields)
  } else {
    return copyPlainObject(object)
  }
}

const copyPlainObject = object => {
  const newObject = Object.create(null)

  for(let key of ownKeys(object)) {
    newObject[key] = copy(object[key])
  }

  return newObject
}

const copyPlainObjectWithExcludes = (object, excludeFields) => {
  const newObject = Object.create(null)

  for(let key in object) {
    if(excludeFields.indexOf(key) > -1) continue

    const value = object[key]
    newObject[key] = copy(value)
  }

  return newObject
}

const copyArray = array => {
  const newArray = []
  array.forEach(function(value) {
    newArray.push(copy(value))
  })
  return newArray
}

export const noCopy = obj => {
  if(!obj) return obj
  Object.defineProperty(obj, noCopyKey, {
    enumerable: false,
    writable: true,
    value: true
  })
  return obj
}
