export type User = {
  name: string
  email: string
  givenName: string
  familyName: string
  icon: string
  startDate: string
  admin: string
  employeeNumber: string
  budgets?: any[]
  loaded: boolean
}

export type Budget = {
  [key: string]: any
}
