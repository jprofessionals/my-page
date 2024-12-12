'use client'

import { useMemo, useState } from 'react'
import { AddJobPostingModal } from '@/components/jobpostings/AddJobPostingModal'
import { Customer, JobPosting as JobPostingType, Tags } from '@/data/types'
import { useJobPostings, usePostJobPosting } from '@/hooks/jobPosting'
import { JobPostingList } from '@/components/jobpostings/JobPostingList'
import { useAuthContext } from '@/providers/AuthProvider'
import RequireAuth from '@/components/auth/RequireAuth'
import TagFilter from '@/components/jobpostings/TagFilter'
import CustomerFilter from '@/components/jobpostings/CustomerFilter'
import DateFilter from '@/components/jobpostings/DateFilter'
import { Dayjs } from 'dayjs'
import { useSearchParams } from 'next/navigation'

export default function Utlysninger() {
  const { user } = useAuthContext()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tags, setTags] = useState<Tags>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [selectedFromDate, setSelectedFromDate] = useState<Dayjs | null>(null)

  const id = searchParams?.get('id')
  const { data: jobPostings } = useJobPostings(
    customer ? [customer.name] : null,
    selectedFromDate ? selectedFromDate.toISOString() : null,
    user?.admin ? null : false,
    id ? [id] : [],
    tags.map((tag) => tag.name),
  )
  const { mutate: createJobPosting } = usePostJobPosting()
  // Definer en konstant for dagens dato
  const now = useMemo(() => { return new Date() }, [])

  const activeJobPostings = useMemo(() => {
    return (
      jobPostings
        ?.filter((jobPosting) => {
          if (jobPosting.urgent) {
            return true
          } else {
            return jobPosting.deadline && new Date(jobPosting.deadline) >= now
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
  }, [jobPostings, now])

  const pastJobPostings = useMemo(() => {
    return (
      jobPostings
        ?.filter((jobPosting) => {
          if (jobPosting.urgent) {
            return false
          }
          if (jobPosting.deadline) {
            return new Date(jobPosting.deadline) < now
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
  }, [jobPostings, now])

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const addJobPosting = (
    newJobPosting: JobPostingType,
    filesToUpload: FileList,
    notify: boolean,
  ) => {
    createJobPosting({
      newJobPosting: newJobPosting,
      filesToUpload: filesToUpload,
      notify: notify,
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

        <h2 className="text-2xl font-bold mb-6">Filtrer utlysninger</h2>
        <TagFilter tags={tags} setTags={setTags} />
        <div className="mb-4" />
        <CustomerFilter customer={customer} setCustomer={setCustomer} />
        <div className="mb-4" />
        <DateFilter value={selectedFromDate} onChange={setSelectedFromDate} />

        <div className="mb-12" />

        <JobPostingList
          title={`Aktive utlysninger${activeJobPostings.length > 0 ? ` (${activeJobPostings.length})` : ''}`}
          jobPostings={activeJobPostings}
        />

        <div className="mb-12" />

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
