import { Apartment } from '@/types'

export const dateFormat = 'yyyy-MM-dd'

export const byIdDesc = (a: Apartment, b: Apartment) => b.id - a.id
