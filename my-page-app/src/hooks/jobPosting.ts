import {
  categorizeJobPostings,
  createJobPosting,
  deleteJobPosting,
  deleteJobPostingFile,
  FileUpload,
  getCategorizationStatus,
  getJobPostingCustomers,
  getJobPostingFiles,
  getJobPostings,
  getJobPostingsByCategory,
  getJobPostingStatistics,
  getJobPostingTags,
  JobPosting,
  JobPostingFiles,
  notifyJobPosting,
  recategorizeAllJobPostings,
  TechCategory,
  updateJobPosting,
  uploadJobPostingFile,
} from '@/data/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/providers/AuthProvider'
import { DateTime } from 'luxon'

// Note: Auth headers and baseUrl are now configured globally in openapi-client.ts
// via request interceptor, so we don't need to pass them to each API call

const jobPostingsCacheName = 'job-postings'
const jobPostingFilesCacheName = 'job-posting-files'
const jobPostingCustomersCacheName = 'job-posting-customers'
const jobPostingTagsCacheName = 'job-posting-tags'

export const useDeleteJobPosting = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      return await deleteJobPosting({
        path: {
          id: id,
        },
      })
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [jobPostingsCacheName] })
    },
  })
}

export const useDeleteJobPostingFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      jobPostingId,
      fileName,
    }: {
      jobPostingId: number
      fileName: string
    }) => {
      return await deleteJobPostingFile({
        path: {
          jobPostingId: jobPostingId,
          fileName: fileName,
        },
      })
    },

    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [jobPostingFilesCacheName, variables.jobPostingId],
      })
    },
  })
}

export const useJobPostingCustomers = () => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostingCustomers = async () => {
    return await getJobPostingCustomers({})
  }

  return useQuery({
    queryKey: [jobPostingCustomersCacheName],
    queryFn: fetchJobPostingCustomers,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const useJobPostingFiles = (id: number) => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostingFiles = async () => {
    return await getJobPostingFiles({
      path: {
        jobPostingId: id,
      },
    })
  }

  return useQuery({
    queryKey: [jobPostingFilesCacheName, id],
    queryFn: fetchJobPostingFiles,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const usePostJobPostingFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      jobPostingId,
      newJobPostingFile,
    }: {
      jobPostingId: number
      newJobPostingFile: FileUpload
    }) => {
      return await uploadJobPostingFile({
        path: {
          jobPostingId: jobPostingId,
        },
        body: newJobPostingFile,
      })
    },

    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [jobPostingFilesCacheName, variables.jobPostingId],
      })
    },
  })
}

export const useJobPostingTags = () => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostingTags = async () => {
    return await getJobPostingTags({})
  }

  return useQuery({
    queryKey: [jobPostingTagsCacheName],
    queryFn: fetchJobPostingTags,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const useJobPostings = (
  customers: string[] | null,
  fromDateTime: string | null,
  hidden: boolean | null,
  includeIds: string[] | null,
  tags: string[] | null,
) => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostings = async () => {
    return await getJobPostings({
      query: {
        customers: customers ? customers : undefined,
        'from-date-time': fromDateTime
          ? fromDateTime
          : DateTime.now().minus({ month: 3 }).toString(),
        hidden: hidden === null ? undefined : hidden,
        'include-ids': includeIds ? includeIds : undefined,
        tags: tags ? tags : undefined,
      },
    })
  }

  return useQuery({
    queryKey: [jobPostingsCacheName, customers, fromDateTime, hidden, tags],
    queryFn: fetchJobPostings,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const usePostJobPosting = () => {
  const queryClient = useQueryClient()
  const { mutate: uploadFile } = usePostJobPostingFiles()

  return useMutation({
    mutationFn: async ({
      newJobPosting,
      notify,
    }: {
      newJobPosting: JobPosting
      filesToUpload?: FileList
      notify: boolean
    }) => {
      return await createJobPosting({
        query: {
          notify: notify,
        },
        body: newJobPosting,
      })
    },

    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [jobPostingsCacheName] })

      if (variables.filesToUpload && variables.filesToUpload.length > 0) {
        Array.from(variables.filesToUpload).forEach((file) => {
          uploadFile({
            jobPostingId: data.data ? data.data.id : 0,
            newJobPostingFile: {
              filename: file.name,
              content: file,
            },
          })
        })
      }
    },
  })
}

export const usePutJobPosting = () => {
  const queryClient = useQueryClient()

  const { mutate: uploadFile } = usePostJobPostingFiles()
  const { mutate: deleteFile } = useDeleteJobPostingFiles()

  return useMutation({
    mutationFn: async ({
      updatedJobPosting,
      updateMessage,
    }: {
      updatedJobPosting: JobPosting
      filesToUpload?: FileList
      filesToDelete?: JobPostingFiles
      updateMessage: string | null
    }) => {
      return await updateJobPosting({
        path: {
          id: updatedJobPosting.id,
        },
        query: {
          'update-message': updateMessage ? updateMessage : undefined,
        },
        body: updatedJobPosting,
      })
    },

    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [jobPostingsCacheName] })

      if (variables.filesToUpload && variables.filesToUpload.length > 0) {
        Array.from(variables.filesToUpload).forEach((file) => {
          uploadFile({
            jobPostingId: variables.updatedJobPosting.id,
            newJobPostingFile: {
              filename: file.name,
              content: file,
            },
          })
        })
      }

      if (variables.filesToDelete && variables.filesToDelete.length > 0) {
        variables.filesToDelete.forEach((file) => {
          deleteFile({
            jobPostingId: variables.updatedJobPosting.id,
            fileName: file.name,
          })
        })
      }
    },
  })
}

export const useNotifyJobPosting = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return await notifyJobPosting({
        path: {
          id: id,
        },
      })
    },
  })
}

const jobPostingStatisticsCacheName = 'job-posting-statistics'

export const useJobPostingStatistics = () => {
  const { userFetchStatus } = useAuthContext()

  const fetchStatistics = async () => {
    return await getJobPostingStatistics({})
  }

  return useQuery({
    queryKey: [jobPostingStatisticsCacheName],
    queryFn: fetchStatistics,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const useCategorizeJobPostings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await categorizeJobPostings({})
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [jobPostingStatisticsCacheName],
      })
    },
  })
}

export const useRecategorizeAllJobPostings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await recategorizeAllJobPostings({})
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [jobPostingStatisticsCacheName],
      })
    },
  })
}

const categorizationStatusCacheName = 'categorization-status'

export const useCategorizationStatus = (enabled: boolean) => {
  const { userFetchStatus } = useAuthContext()

  const fetchStatus = async () => {
    return await getCategorizationStatus({})
  }

  return useQuery({
    queryKey: [categorizationStatusCacheName],
    queryFn: fetchStatus,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched' && enabled,
    refetchInterval: (query) => {
      // Poll every 2 seconds while categorization is running
      const data = query.state.data
      return data && 'isRunning' in data && data.isRunning ? 2000 : false
    },
  })
}

const jobPostingsByCategoryCacheName = 'job-postings-by-category'

export const useJobPostingsByCategory = (
  category: TechCategory | null,
  month: string | null
) => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostings = async () => {
    if (!category || !month) return { data: [] }
    return await getJobPostingsByCategory({
      query: {
        category,
        month,
      },
    })
  }

  return useQuery({
    queryKey: [jobPostingsByCategoryCacheName, category, month],
    queryFn: fetchJobPostings,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched' && !!category && !!month,
  })
}
