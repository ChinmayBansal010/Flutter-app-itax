import { copy } from 'quiver-object'
import { ExtensibleHandler } from './extensible-component'

const combineStreamHandlers = (handler1, handler2) => 
  (args, streamable) =>
    handler1(copy(args), streamable).then(streamable =>
      handler2(args, streamable))

const streamCombinator = {
  field: 'streamHandler',
  combineHandlers: combineStreamHandlers
}

const defaultCombinators = [streamCombinator]

const combineHandleables = (handleable1, handleable2, combinators) => {
  const newHandleable = { }

  combinators.forEach(({ field, combineHandlers }) => {
    const handler1 = handleable1[field]
    const handler2 = handleable2[field]

    if(!handler1 || !handler2) return

    const newHandler = combineHandlers(handler1, handler2)
    newHandleable[field] = newHandler
  })

  return newHandleable
}

const pipelineHandleables = (handleables, combinators) => {
  if(handleables.length == 1) return handleables[0]

  const [handleable1, handleable2, ...restHandleables] = handleables

  const newHandleable = combineHandleables(
    handleable1, handleable2, combinators)

  return pipelineHandleables(
    [newHandleable, ...restHandleables], combinators)
}

const pipelineBuilder = (builders, combinators) =>
  config =>
    Promise.all(builders.map(
      builder => builder(config)))
    .then(handleables => 
      pipelineHandleables(handleables, combinators))

export class Pipeline extends ExtensibleHandler {
  constructor(options={}) {
    const { pipelineCombinators=defaultCombinators } = options

    super(options)
    
    this._pipelineCombinators = pipelineCombinators
    this.subComponents.pipelineHandlers = []
  }

  addPipe(component) {
    if(!component.isHandlerComponent) {
      throw new TypeError(
        'component must be of type HandlerComponent')
    }

    this.subComponents.pipelineHandlers.push(component)
    return this
  }

  pipe(component) {
    return this.addPipe(component)
  }

  get pipelineHandlers() {
    return this.subComponents.pipelineHandlers
  }

  toMainHandleableBuilder() {
    const builders = this.pipelineHandlers.map(
      component => component.toHandleableBuilder())

    if(builders.length == 0) throw new Error(
      'Pipeline must contain at least one handler component')

    const combinators = this._pipelineCombinators

    return pipelineBuilder(builders, combinators)
  }

  get type() {
    return 'pipeline'
  }

  toJson() {
    const json = super.toJson()
    json.pipelines = this.pipelineHandlers.map(
      component => component.toJson())

    return json
  }
}

export const pipeline = options =>
  new Pipeline(options)