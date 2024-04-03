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
export type Apartment = {
  id: number
  cabin_name: string
}
export type Booking = {
  id: number
  startDate: string
  endDate: string
  apartment: Apartment
  employeeName: string
  isPending: boolean
  createdDate?: string
}

export type BookingPost = {
  apartmentID: number
  startDate: string
  endDate: string
}

export type EditedBooking = {
  startDate: string
  endDate: string,
  apartmentId: number
}

export type PendingBookingTrain = {
  id: string
  apartment: Apartment
  startDate: string
  endDate: string
  drawingPeriodList: DrawingPeriod[]
}

export type DrawingPeriod = {
  id: string
  startDate: string
  endDate: string
  pendingBookings: Booking[]
}

export type InfoBooking = {
  id: number
  startDate: string
  endDate: string
  description: string
}

export type InfoBookingPost = {
  startDate: string
  endDate: string
  description: string
}

export type EditedInfoNotice = {
  startDate: string
  endDate: string
  description: string
}

export type BudgetSummary = {
  year: number  
  yearSummary?: BudgetYearSummary[]
}

export type BudgetYearSummary = {
  budgetType: BudgetType
  sum: number
  hours: number
  balance: number
}

export type Settings = {
  settingId: string
  priority: number
  description: string
  settingValue: string
}
