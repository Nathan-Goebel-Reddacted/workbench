import { NETWORK_FAILURE_MESSAGE, describeResponse, shouldReportFailure, shouldReportResponse } from './errorRules'

export type InterceptorHandlers = {
  onRequestStart: () => void
  onError: (message: string) => void
}

export function createInterceptedFetch(original: typeof fetch, handlers: InterceptorHandlers): typeof fetch {
  return async (input, init) => {
    handlers.onRequestStart()
    try {
      const res = await original(input, init)
      if (shouldReportResponse(res)) handlers.onError(await describeResponse(res))
      return res
    } catch (cause) {
      if (shouldReportFailure(cause)) handlers.onError(NETWORK_FAILURE_MESSAGE)
      throw cause
    }
  }
}
