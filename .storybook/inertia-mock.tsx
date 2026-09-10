import React from 'react'
import { InertiaPageContext } from './decorators'

// Mock de usePage qui utilise le context fourni par le decorator
export function usePage() {
  return React.useContext(InertiaPageContext)
}

// Mock des autres exports nécessaires d'Inertia
export const Link = ({ href, children, ...props }: any) => (
  <a href={href} {...props}>
    {children}
  </a>
)

export const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>

export const router = {
  get: () => {},
  post: () => {},
  put: () => {},
  patch: () => {},
  delete: () => {},
  reload: () => {},
  visit: () => {},
}

// Mock de useHttp (Inertia 3).
// Les nombreuses signatures de useHttp (method/url, urlMethodPair, rememberKey, data...)
// diffèrent uniquement par leurs premiers arguments : les données initiales sont
// toujours le dernier argument.
export function useHttp(...args: any[]) {
  const rawData = args[args.length - 1]
  const initialData = () => {
    const value = typeof rawData === 'function' ? rawData() : rawData
    return value && typeof value === 'object' ? value : {}
  }

  const [data, setDataState] = React.useState<any>(initialData)
  const [errors, setErrorsState] = React.useState<any>({})
  const [processing] = React.useState(false)

  const noopAsync = async () => undefined

  const api: any = {
    data,
    isDirty: false,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    processing,
    progress: null,
    wasSuccessful: false,
    recentlySuccessful: false,
    response: null,
    setData: (keyOrObjectOrFn: any, value?: any) => {
      if (typeof keyOrObjectOrFn === 'string') {
        setDataState((prev: any) => ({ ...prev, [keyOrObjectOrFn]: value }))
      } else if (typeof keyOrObjectOrFn === 'function') {
        setDataState((prev: any) => ({ ...prev, ...keyOrObjectOrFn(prev) }))
      } else {
        setDataState((prev: any) => ({ ...prev, ...keyOrObjectOrFn }))
      }
    },
    transform: () => {},
    setDefaults: () => {},
    reset: () => setDataState(initialData()),
    clearErrors: () => setErrorsState({}),
    resetAndClearErrors: () => {
      setDataState(initialData())
      setErrorsState({})
    },
    setError: (fieldOrErrors: any, value?: any) => {
      if (typeof fieldOrErrors === 'string') {
        setErrorsState((prev: any) => ({ ...prev, [fieldOrErrors]: value }))
      } else {
        setErrorsState((prev: any) => ({ ...prev, ...fieldOrErrors }))
      }
    },
    submit: noopAsync,
    get: noopAsync,
    post: noopAsync,
    put: noopAsync,
    patch: noopAsync,
    delete: noopAsync,
    cancel: () => {},
    dontRemember: () => api,
    optimistic: () => api,
    withAllErrors: () => api,
    withPrecognition: () => api,
    // Champs ajoutés par withPrecognition() sur l'API réelle, exposés ici
    // directement pour que le mock fonctionne que withPrecognition soit
    // appelé ou non.
    invalid: () => false,
    setValidationTimeout: () => api,
    touch: () => api,
    touched: () => false,
    valid: () => false,
    validate: () => api,
    validateFiles: () => api,
    validating: false,
    validator: () => ({}) as any,
    withoutFileValidation: () => api,
    setErrors: (errorsToSet: any) => {
      setErrorsState(errorsToSet)
      return api
    },
    forgetError: () => api,
  }

  return api
}
