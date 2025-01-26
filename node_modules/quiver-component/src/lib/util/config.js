import { copy, noCopy } from 'quiver-object'

const configNormalized = Symbol('ConfigNormalized')
const handlerMap = Symbol('handlerMap')
const bundleMap = Symbol('bundleMap')
const initTable = Symbol('initTable')

export const globalConfig = config => {
  if(!config.global) {
    config.global = noCopy({})
  }

  return config.global
}

export const normalizeConfig = config => {
  const global = globalConfig(config)

  if(global[configNormalized]) return

  if(!global[handlerMap]) {
    global[handlerMap] = noCopy({})
  }

  if(!global[bundleMap]) {
    global[bundleMap] = noCopy({})
  }

  if(!global[initTable]) {
    global[initTable] = { }
  }

  global[configNormalized] = true

  return config
}

export const getHandlerMap = config => {
  normalizeConfig(config)

  return config.global[handlerMap]
}

export const getBundleMap = config => {
  normalizeConfig(config)

  return config.global[bundleMap]
}

export const getInitTable = config => {
  normalizeConfig(config)

  return config.global[initTable]
}

export const getHandleable = (config, component) => {
  const handlerMap = getHandlerMap(config)
  return handlerMap[component.id]
}

export const getBundle = (config, component) => {
  const bundleMap = getBundleMap(config)
  return bundleMap[component.id]
}