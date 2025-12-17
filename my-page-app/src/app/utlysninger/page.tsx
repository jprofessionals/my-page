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

  // ASAP postings are prioritized (sorted to top) only for 5 days after creation
  const ASAP_PRIORITY_DAYS = 5

  const hasActiveFilters = tags.length > 0 || customer !== null || selectedFromDate !== null

  const clearFilters = () => {
    setTags([])
    setCustomer(null)
    setSelectedFromDate(null)
  }

  const activeJobPostings = useMemo(() => {
    const priorityCutoff = new Date(now.getTime() - ASAP_PRIORITY_DAYS * 24 * 60 * 60 * 1000)

    // Helper to check if ASAP posting is still in priority period (sorted to top)
    const isAsapPriority = (jobPosting: JobPostingType) => {
      if (!jobPosting.urgent) return false
      if (!jobPosting.created_date) return true // If no created_date, keep at top
      return new Date(jobPosting.created_date) >= priorityCutoff
    }

    // Helper to check if ASAP posting has expired (after 5 days)
    const isAsapExpired = (jobPosting: JobPostingType) => {
      if (!jobPosting.urgent) return false
      if (!jobPosting.created_date) return false // If no created_date, don't expire
      return new Date(jobPosting.created_date) < priorityCutoff
    }

    return (
      jobPostings
        ?.filter((jobPosting) => {
          if (jobPosting.urgent) {
            // ASAP postings expire after 5 days
            return !isAsapExpired(jobPosting)
          } else {
            return jobPosting.deadline && new Date(jobPosting.deadline) >= now
          }
        })
        .sort((a, b) => {
          const aIsAsapPriority = isAsapPriority(a)
          const bIsAsapPriority = isAsapPriority(b)

          // Both are ASAP priority - sort by created_date (newest first)
          if (aIsAsapPriority && bIsAsapPriority) {
            const aCreated = a.created_date ? new Date(a.created_date).getTime() : 0
            const bCreated = b.created_date ? new Date(b.created_date).getTime() : 0
            return bCreated - aCreated
          }

          // Only a is ASAP priority - a comes first
          if (aIsAsapPriority) return -1

          // Only b is ASAP priority - b comes first
          if (bIsAsapPriority) return 1

          // Neither is ASAP priority - sort by deadline (or created_date for old ASAP)
          const aVal = a.urgent
            ? (a.created_date ? new Date(a.created_date).getTime() : Number.MAX_SAFE_INTEGER)
            : (a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER)
          const bVal = b.urgent
            ? (b.created_date ? new Date(b.created_date).getTime() : Number.MAX_SAFE_INTEGER)
            : (b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER)
          return aVal - bVal
        }) || []
    )
  }, [jobPostings, now, ASAP_PRIORITY_DAYS])

  const pastJobPostings = useMemo(() => {
    const expiryCutoff = new Date(now.getTime() - ASAP_PRIORITY_DAYS * 24 * 60 * 60 * 1000)

    return (
      jobPostings
        ?.filter((jobPosting) => {
          if (jobPosting.urgent) {
            // ASAP postings go to past after 5 days
            if (!jobPosting.created_date) return false
            return new Date(jobPosting.created_date) < expiryCutoff
          }
          if (jobPosting.deadline) {
            return new Date(jobPosting.deadline) < now
          }
          return true
        })
        .map((jobPosting) => {
          // Remove urgent flag from expired ASAP postings so they display normally
          if (jobPosting.urgent) {
            return { ...jobPosting, urgent: false }
          }
          return jobPosting
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
  }, [jobPostings, now, ASAP_PRIORITY_DAYS])

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
