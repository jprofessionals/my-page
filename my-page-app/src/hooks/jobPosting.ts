import { getJobPostings } from '@/data/types'
import { useQuery } from 'react-query'
import authHeader from '@/services/auth-header'

export const useJobPostings = () => {
  return useQuery(
    ['job-postings'],
    async () => {
      return await getJobPostings({
        headers: authHeader(),
        baseUrl: '/api',
      })
    },
    {
      select: (result) => result.data,
    },
  )
}
