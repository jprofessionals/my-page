import { getJobPostings } from '@/data/types'
import { useQuery } from 'react-query'
import authHeader from '@/services/auth-header'
import { useAuthContext } from '@/providers/AuthProvider'

export const useJobPostings = () => {
  const { userFetchStatus } = useAuthContext()

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
      enabled: userFetchStatus === 'fetched',
    },
  )
}
