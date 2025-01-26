import { copy } from './copy'

const noCopy = object => object

export const merge = (objects, options={}) => {
  const copyObject = options.copy ? copy : noCopy
  const mergedObject = { }

  objects.forEach(function(object) {
    for(let key in object) {
      mergedObject[key] = copyObject(object[key])
    }
  })

  return mergedObject
}
