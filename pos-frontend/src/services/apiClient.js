import { authorizedApiRequest } from '../authSession'

export const createApiRequest = (apiBaseUrl) => {
  return async (path, options) => authorizedApiRequest(apiBaseUrl, path, options)
}

