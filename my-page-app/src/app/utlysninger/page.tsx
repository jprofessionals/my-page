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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons'

export default function Utlysninger() {
  const { user } = useAuthContext()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tags, setTags] = useState<Tags>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [selectedFromDate, setSelectedFromDate] = useState<Dayjs | null>(null)
  const [showPastPostings, setShowPastPostings] = useState(false)

  const id = searchParams?.get('id')
  const { data: jobPostings } = useJobPostings(
    customer ? [customer.name] : null,
    selectedFromDate ? selectedFromDate.toISOString() : null,
    user?.admin ? null : false,
    id ? [id] : [],
    tags.map((tag) => tag.name),
  )
  const { mutate: createJobPosting } = usePostJobPosting()

  const now = useMemo(() => {
    return new Date()
  }, [])

  const hasActiveFilters = tags.length > 0 || customer !== null || selectedFromDate !== null

  const clearFilters = () => {
    setTags([])
    setCustomer(null)
    setSelectedFromDate(null)
  }

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
      <div className="container mx-auto px-4 py-8">
        {/* Header with title and action button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Utlysninger</h1>
          {user?.admin && (
            <button
              onClick={openModal}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Ny utlysning
            </button>
          )}
        </div>

        {/* Filter section */}
        <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TagFilter tags={tags} setTags={setTags} />
            <CustomerFilter customer={customer} setCustomer={setCustomer} />
            <DateFilter value={selectedFromDate} onChange={setSelectedFromDate} />
          </div>
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FontAwesomeIcon icon={faFilterCircleXmark} className="w-4 h-4" />
                Nullstill filter
              </button>
            </div>
          )}
        </div>

        {/* Active job postings */}
        <JobPostingList
          title={`Aktive utlysninger (${activeJobPostings.length})`}
          jobPostings={activeJobPostings}
        />

        {/* Past job postings - collapsible */}
        {pastJobPostings.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setShowPastPostings(!showPastPostings)}
              className="flex items-center gap-2 text-xl font-bold text-gray-700 hover:text-gray-900 mb-5"
            >
              <span
                className={`transform transition-transform ${showPastPostings ? 'rotate-90' : ''}`}
              >
                ▶
              </span>
              Tidligere utlysninger ({pastJobPostings.length})
            </button>
            {showPastPostings && (
              <JobPostingList title="" jobPostings={pastJobPostings} />
            )}
          </div>
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
