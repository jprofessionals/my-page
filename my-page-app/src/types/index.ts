import { Property } from 'csstype'
import Float = Property.Float

export type User = {
  name: string
  email: string
  givenName: string
  familyName: string
  icon: string
  startDate: string
  admin: string
  employeeNumber: string
  budgets?: Budget[]
  loaded: boolean
}

export type Budget = {
  id: string
  posts: Post[]
  budgetType: BudgetType
  startDate: Date
  startAmount: number
  hours: Hour[]
  balance: number
  sumHours: number
  sumHoursCurrentYear: number
  sumPostsCurrentYear: number
  sumPostsLastTwelveMonths: number
  sumHoursLastTwelveMonths: number
}

type Post = {
  id?: number
  date: Date
  description?: string
  amountIncMva?: number
  amountExMva?: number
  documentNumber?: string
  dateOfPayment?: Date
  dateOfDeduction?: Date
  expense: boolean
  locked: boolean
  createdDate?: Date
  lastModifiedDate?: Date
  createdBy?: string
}

type Hour = {
  id?: number
  hours: number
  createdBy: string
  dateOfUsage: Date
}

export type BudgetType = {
  id: number
  name: string
  rollOver: boolean
  deposit: number
  intervalOfDepositInMonths: number
  startAmount: number
  allowTimeBalance: boolean
  balanceIsHours?: boolean
}

export type NewEmployee = {
  email: string
  employeeNumber: string
  budgetStartDate: string
}

export type JobPostingType = {
  id?: number
  title: string
  description?: string
  tags?: string[]
  customer: string
  location?: String
  dueDateForApplication?: string
  requiredYearsOfExperience?: number
  resourcesNeeded?: number
}
