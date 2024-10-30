import { useState } from 'react'
import { JobPosting as JobPostingType } from '@/data/types'
import { EditJobPostingModal } from '@/components/jobpostings/EditJobPostingModal'
import { usePutJobPosting } from '@/hooks/jobPosting'

export const JobPosting = (jobPosting: JobPostingType) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { mutate: updateJobPosting } = usePutJobPosting()

  const toggleExpansion = () => setIsExpanded(!isExpanded)

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const editJobPosting = (jobPosting: JobPostingType) => {
    updateJobPosting(jobPosting)
    closeModal()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpansion()
    }
  }

  // Format the deadline to Norwegian format
  const formattedDeadline = new Intl.DateTimeFormat('no-NO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Oslo',
  }).format(new Date(jobPosting.deadline))

  return (
    <>
      <div className="border border-gray-200 rounded-lg mb-4">
        <div
          className="relative z-10 flex justify-between items-center p-4 cursor-pointer bg-gray-200 hover:bg-gray-300 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={toggleExpansion}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-expanded={isExpanded}
        >
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {jobPosting.title}
            </h2>
            <p className="text-gray-700">{jobPosting.customer}</p>
          </div>
          <button onClick={openModal}>Endre</button>
          <div>
            <p className="text-sm font-bold text-gray-800">Frist</p>
            <p className="text-sm text-gray-700">{formattedDeadline}</p>
          </div>
        </div>

        {isExpanded && (
          <div className="relative z-0 p-4 bg-white">
            <div className="flex flex-wrap gap-2 mb-2">
              {jobPosting.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-gray-800">{jobPosting.description}</p>

            {jobPosting.files.length > 0 && (
              <div className="mt-2">
                <h3 className="font-semibold text-gray-800">Filer:</h3>
                <ul className="list-disc list-inside text-gray-800">
                  {jobPosting.files.map((file, index) => (
                    <li key={index}>
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {file}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {jobPosting.links.length > 0 && (
              <div className="mt-2">
                <h3 className="font-semibold text-gray-800">Lenker:</h3>
                <ul className="list-disc list-inside text-gray-800">
                  {jobPosting.links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      {isModalOpen && (
        <EditJobPostingModal
          jobPosting={jobPosting}
          onClose={closeModal}
          onEditJobPosting={editJobPosting}
        />
      )}
    </>
  )
}
