export let error = (errorCode, errorMessage, details) =>
  new ServerError(errorCode, errorMessage, details)

class ServerError extends Error {
  constructor(errorCode=500, errorMessage='', details={}) {
    super(errorMessage)

    Error.captureStackTrace(this, error)
    this._errorCode = errorCode
    this._errorMessage = errorMessage
    this._errorDetails = details
  }

  get name() {
    return 'ServerError'
  }

  get code() {
    return this._errorCode
  }

  get errorCode() {
    return this._errorCode
  }

  get message() {
    return this._errorMessage
  }

  get details() {
    return this._errorDetails
  }

  format() {
    return `[Error ${this.errorCode}: ${this.message}]\n${this.stack}`
  }

  inspect() {
    return this.format()
  }
}
