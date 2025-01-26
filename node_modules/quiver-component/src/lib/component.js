const assertComponent = component => {
  if(!component.isQuiverComponent) {
    throw new Error('object must be of type Component')
  }
}

// Random ID for easier identifying
const randomId = () =>
  Symbol((Math.random() * 0x10000000 | 0).toString(16))

export class Component {
  constructor(options={}) {
    const { 
      name,
      subComponents = { }
    } = options

    this._id = randomId()
    this._options = options

    if(name) {
      this.name = name
    }

    for(let key in subComponents) {
      const component = subComponents[key]
      assertComponent(component)
    }

    this._subComponents = subComponents
  }

  get id() {
    return this._id
  }

  get type() {
    return 'component'
  }

  get isQuiverComponent() {
    return true
  }

  get subComponents() {
    return this._subComponents
  }

  addSubComponent(key, component) {
    if(!component.isQuiverComponent) {
      throw new Error('Subcomponent must be Quiver component')
    }

    const { subComponents } = this

    if(subComponents[key]) {
      throw new Error('Subcomponent already registered at given key')
    }

    subComponents[key] = component
  }

  getSubComponent(key) {
    return this.subComponents[key]
  }

  setName(name) {
    this.name = name
    return this
  }

  clone() {
    const newInstance = Object.create(this)

    const privateId = randomId()
    Object.defineProperty(newInstance, 'id', {
      get() {
        return privateId
      }
    })

    return newInstance
  }

  applyMap(mapper, mapTable={}) {
    const currentId = this.id

    if(mapTable[currentId]) {
      return mapTable[currentId]
    }

    return mapTable[currentId] = mapper(this, mapTable)
  }

  map(mapper, mapTable={}) {
    const clone = this.clone()
    this.doMap(clone, mapper, mapTable)
    return clone
  }

  each(iteratee) {
    const { subComponents } = this

    for(let key in subComponents) {
      iteratee(subComponents[key])
    }
  }

  doMap(target, mapper, mapTable) {
    const { subComponents } = this
    const newSubComponents = { }

    for(let key in subComponents) {
      const component = subComponents[key]

      newSubComponents[key] = component.applyMap(
        mapper, mapTable)
    }

    target._subComponents = newSubComponents
  }

  factory() {
    return (forkTable={}) =>
      this.fork(forkTable)
  }

  fork(forkTable={}) {
    return this.applyMap(
      (component, mapTable) =>
        component.map(
          (subComponent, mapTable) =>
            subComponent.fork(mapTable)
          , mapTable)
      , forkTable)
  }

  implement(componentMap) {
    this.each(component => 
      component.implement(componentMap))

    return this
  }

  toJson() {
    const json = { 
      id: this.id.toString(),
      type: this.type
    }

    if(this.name) {
      json.name = this.name
    }
    
    return json
  }

  toString() {
    return JSON.stringify(this.toJson(), undefined, 2)
  }

  inspect() {
    return this.toString()
  }
}