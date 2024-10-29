import { createJobPosting, getJobPostings, JobPosting } from '@/data/types'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import authHeader from '@/services/auth-header'
import { useAuthContext } from '@/providers/AuthProvider'

const cacheName = 'job-postings'

export const useJobPostings = () => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostings = async () => {
    return await getJobPostings({
      headers: authHeader(),
      baseUrl: '/api',
    })
  }

  return useQuery(cacheName, fetchJobPostings, {
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const usePostJobPosting = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (newJobPosting: JobPosting) => {
      return await createJobPosting({
        body: newJobPosting,
        headers: authHeader(),
        baseUrl: '/api',
      })
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(cacheName)
      },
    },
  )
}
