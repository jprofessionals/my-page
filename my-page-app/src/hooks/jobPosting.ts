import {
  createJobPosting,
  deleteJobPosting,
  deleteJobPostingFile,
  FileUpload,
  getJobPostingCustomers,
  getJobPostingFiles,
  getJobPostings,
  getJobPostingTags,
  JobPosting,
  JobPostingFiles,
  updateJobPosting,
  uploadJobPostingFile,
} from '@/data/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import authHeader from '@/services/auth-header'
import { useAuthContext } from '@/providers/AuthProvider'

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
        headers: authHeader(),
        baseUrl: '/api',
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
        headers: authHeader(),
        baseUrl: '/api',
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
    return await getJobPostingCustomers({
      headers: authHeader(),
      baseUrl: '/api',
    })
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
      headers: authHeader(),
      baseUrl: '/api',
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
        headers: authHeader(),
        baseUrl: '/api',
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
    return await getJobPostingTags({
      headers: authHeader(),
      baseUrl: '/api',
    })
  }

  return useQuery({
    queryKey: [jobPostingTagsCacheName],
    queryFn: fetchJobPostingTags,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const useJobPostings = (tags: string[] | null) => {
  const { userFetchStatus } = useAuthContext()

  const fetchJobPostings = async () => {
    return await getJobPostings({
      query: {
        tags: tags ? tags : undefined,
      },
      headers: authHeader(),
      baseUrl: '/api',
    })
  }

  return useQuery({
    queryKey: [jobPostingsCacheName, tags],
    queryFn: fetchJobPostings,
    select: (result) => result.data,
    enabled: userFetchStatus === 'fetched',
  })
}

export const usePostJobPosting = () => {
  const queryClient = useQueryClient()
  const { mutate: uploadFile } = usePostJobPostingFiles()
  const { mutate: deleteFile } = useDeleteJobPostingFiles()

  return useMutation({
    mutationFn: async ({
      newJobPosting,
    }: {
      newJobPosting: JobPosting
      filesToUpload?: FileList
      filesToDelete?: JobPostingFiles
    }) => {
      return await createJobPosting({
        body: newJobPosting,
        headers: authHeader(),
        baseUrl: '/api',
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

      if (variables.filesToDelete && variables.filesToDelete.length > 0) {
        variables.filesToDelete.forEach((file) => {
          deleteFile({
            jobPostingId: data.data ? data.data.id : 0,
            fileName: file.name,
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
    }: {
      updatedJobPosting: JobPosting
      filesToUpload?: FileList
      filesToDelete?: JobPostingFiles
    }) => {
      return await updateJobPosting({
        path: {
          id: updatedJobPosting.id,
        },
        body: updatedJobPosting,
        headers: authHeader(),
        baseUrl: '/api',
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
