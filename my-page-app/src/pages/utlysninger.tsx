import { useState } from 'react'
import dynamic from 'next/dynamic'
import { JobPosting } from '@/components/jobpostings/JobPosting'
import { AddJobPostingModal } from '@/components/jobpostings/AddJobPostingModal'
import {
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
} from '@/data/types'
import { useJobPostings, usePostJobPosting } from '@/hooks/jobPosting'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function Utlysninger() {
  const user = { admin: true }
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: jobPostings } = useJobPostings()
  const { mutate: createJobPosting } = usePostJobPosting()

  const activeJobPostings = jobPostings?.filter((jobPosting) => {
    return new Date(jobPosting.deadline) >= new Date()
  })

  const pastJobPostings = jobPostings?.filter((jobPosting) => {
    return new Date(jobPosting.deadline) < new Date()
  })

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

        <h2 className="text-2xl font-bold mb-3">Aktive utlysninger</h2>
        {activeJobPostings && activeJobPostings.length > 0 ? (
          <ul className="space-y-4">
            {activeJobPostings.map((jobPosting) => (
              <li key={jobPosting.id}>
                <JobPosting {...jobPosting} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3">Ingen utlysninger</p>
        )}

        <h2 className="text-2xl font-bold mb-3">Tidligere utlysninger</h2>
        {pastJobPostings && pastJobPostings.length > 0 ? (
          <ul className="space-y-4">
            {pastJobPostings.map((jobPosting) => (
              <li key={jobPosting.id}>
                <JobPosting {...jobPosting} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3">Ingen utlysninger</p>
        )}
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
