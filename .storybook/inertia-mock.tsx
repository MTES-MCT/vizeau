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
