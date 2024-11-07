import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AddJobPostingModal } from '@/components/jobpostings/AddJobPostingModal'
import {
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
} from '@/data/types'
import { useJobPostings, usePostJobPosting } from '@/hooks/jobPosting'
import { JobPostingList } from '@/components/jobpostings/JobPostingList'
import { useAuthContext } from '@/providers/AuthProvider'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function Utlysninger() {
  const { user } = useAuthContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: jobPostings } = useJobPostings()
  const { mutate: createJobPosting } = usePostJobPosting()

  const activeJobPostings = useMemo(() => {
    return (
      jobPostings
        ?.filter((jobPosting) => {
          if (jobPosting.urgent) {
            return true
          } else {
            return (
              jobPosting.deadline && new Date(jobPosting.deadline) >= new Date()
            )
          }
        })
        .sort((a, b) => {
          const aVal = a.urgent
            ? 0
            : a.deadline
              ? new Date(a.deadline).getTime()
              : 0
          const bVal = b.urgent
            ? 0
            : b.deadline
              ? new Date(b.deadline).getTime()
              : 0
          return aVal - bVal
        }) || []
    )
  }, [jobPostings])

  const pastJobPostings = useMemo(() => {
    return (
      jobPostings
        ?.filter((jobPosting) => {
          if (jobPosting.urgent) {
            return false
          }
          if (jobPosting.deadline) {
            return new Date(jobPosting.deadline) < new Date()
          }
          return true
        })
        .sort((a, b) => {
          const aVal = a.deadline
            ? new Date(a.deadline).getTime()
            : Number.MAX_SAFE_INTEGER
          const bVal = b.deadline
            ? new Date(b.deadline).getTime()
            : Number.MAX_SAFE_INTEGER
          return bVal - aVal
        }) || []
    )
  }, [jobPostings])

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const addJobPosting = (
    newJobPosting: JobPostingType,
    filesToUpload: FileList,
    filesToDelete: JobPostingFilesType,
  ) => {
    createJobPosting({
      newJobPosting: newJobPosting,
      filesToUpload: filesToUpload,
      filesToDelete: filesToDelete,
    })
    closeModal()
  }

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8 relative z-0">
        <h1 className="text-3xl font-bold mb-6">Utlysninger</h1>

        {user?.admin && (
          <button
            onClick={openModal}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Legg til ny utlysning
          </button>
        )}

        <JobPostingList
          title="Aktive utlysninger"
          jobPostings={activeJobPostings}
        />

        <JobPostingList
          title="Tidligere utlysninger"
          jobPostings={pastJobPostings}
        />
      </div>

      {isModalOpen && (
        <AddJobPostingModal
          onClose={closeModal}
          onAddJobPosting={addJobPosting}
        />
      )}
    </RequireAuth>
  )
}
