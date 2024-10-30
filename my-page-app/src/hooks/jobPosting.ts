import {
  createJobPosting,
  deleteJobPosting, getJobPostingFiles,
  getJobPostings,
  JobPosting,
  updateJobPosting,
} from '@/data/types'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import authHeader from '@/services/auth-header'
import { useAuthContext } from '@/providers/AuthProvider'

const jobPostingsCacheName = 'job-postings'
const jobPostingFilesCacheName = 'job-posting-files'

export const useDeleteJobPosting = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (id: number) => {
      return await deleteJobPosting({
        path: {
          id: id,
        },
        headers: authHeader(),
        baseUrl: '/api',
      })
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(jobPostingsCacheName)
      },
    },
  )
}

export const useJobPostingFiles = (id: number) => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostingFiles = async () => {
    return await getJobPostingFiles({
      path: {
        id: id,
      },
      headers: authHeader(),
      baseUrl: '/api',
    })
  }

  return useQuery([jobPostingFilesCacheName, id], fetchJobPostingFiles, {
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const useJobPostings = () => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostings = async () => {
    return await getJobPostings({
      headers: authHeader(),
      baseUrl: '/api',
    })
  }

  return useQuery(jobPostingsCacheName, fetchJobPostings, {
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
        await queryClient.invalidateQueries(jobPostingsCacheName)
      },
    },
  )
}

export const usePutJobPosting = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (updatedJobPosting: JobPosting) => {
      return await updateJobPosting({
        path: {
          id: updatedJobPosting.id,
        },
        body: updatedJobPosting,
        headers: authHeader(),
        baseUrl: '/api',
      })
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(jobPostingsCacheName)
      },
    },
  )
}
