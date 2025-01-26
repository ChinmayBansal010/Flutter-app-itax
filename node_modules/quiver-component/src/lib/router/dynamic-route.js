const paramRegexString = '([^\\/]+)'
const restPathRegex = /\/:restpath$/

const escapeRegExp = string =>
  string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")

const invalidUrlRegex = /[^\w\$\-\_\.\+\!\*\'\(\)\,]/
const invalidSubpathRegex = /[^\w\$\-\_\.\+\!\*\'\(\)\,\/]/

export const regexMatcher = (regex, fields=[]) =>
  (path, args) => {
    const matches = path.match(regex)
    if(!matches) return false

    for(let i=0; i<fields.length; i++) {
      const key = fields[i]
      const match = matches[i+1]

      args[key] = match
    }

    return true
  }

export const paramMatcher = paramPath => {
  const hasRestPath = restPathRegex.test(paramPath)

  if(hasRestPath)
    paramPath = paramPath.replace(restPathRegex, '')

  const parts = paramPath.split(/(:\w+)/)

  let regexString = '^'
  let matchFields = []

  parts.forEach(part => {
    if(part[0] == ':' && part.length > 1) {
      const field = part.slice(1)
      matchFields.push(field)

      regexString += paramRegexString

    } else {
      regexString += escapeRegExp(part)
    }
  })

  if(hasRestPath) {
    regexString += '(\\/.*)'
    matchFields.push('path')
  }

  regexString += '$'

  const regex = new RegExp(regexString)

  return regexMatcher(regex, matchFields)
}

export const paramUrlBuilder = (paramPath) => {
  const hasRestPath = restPathRegex.test(paramPath)

  if(hasRestPath)
    paramPath = paramPath.replace(restPathRegex, '')

  const parts = paramPath.split(/(:\w+)/)

  return (args, restPath='/') => {
    const url = ''

    parts.forEach(part => {
      if(part[0] == ':' && part.length > 1) {
        const field = part.slice(1)
        const value = args[field]

        if(typeof(value) != 'string')
          throw new Error('args value for subpath ' 
            + field + ' is not of type string')

        if(invalidUrlRegex.test(value))
          throw new Error('args value must be url escaped before hand')

        url += value

      } else {
        url += part
      }
    })

    if(hasRestPath) {
      if(invalidSubpathRegex.test(restPath))
        throw new Error('args value must be url escaped before hand')

      if(url.slice(-1) == '/' && restPath[0] == '/') {
        url += restPath.slice(1)
      } else {
        url += restPath
      }
    }

    return url
  }
}