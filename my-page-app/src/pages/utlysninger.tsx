import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuthContext } from '@/providers/AuthProvider'
import { JobPosting } from '@/components/jobpostings/JobPosting'
import { AddJobPostingModal } from '@/components/jobpostings/AddJobPostingModal'
import { JobPostingType } from '@/types/jobPosting'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function Utlysninger() {
  const { user } = useAuthContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [jobPostings, setJobPostings] = useState<JobPostingType[]>([])

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const addJobPosting = (newJobPosting: JobPostingType) => {
    setJobPostings([...jobPostings, newJobPosting])
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

        <ul className="space-y-4">
          {jobPostings.map((jobPosting) => (
            <li key={jobPosting.id}>
              <JobPosting {...jobPosting} />
            </li>
          ))}
        </ul>
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
