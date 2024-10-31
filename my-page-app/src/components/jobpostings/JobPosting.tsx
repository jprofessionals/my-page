import { useEffect, useState } from 'react'
import { JobPosting as JobPostingType } from '@/data/types'
import { EditJobPostingModal } from '@/components/jobpostings/EditJobPostingModal'
import {
  useDeleteJobPosting,
  useJobPostingFiles,
  usePostJobPostingFiles,
  usePutJobPosting,
} from '@/hooks/jobPosting'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/providers/AuthProvider'

export const JobPosting = (jobPosting: JobPostingType) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { data: existingJobPostingFiles } = useJobPostingFiles(jobPosting.id)
  const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null)
  const { mutate: uploadFile } = usePostJobPostingFiles()
  const { mutate: updateJobPosting } = usePutJobPosting()
  const { mutate: deleteJobPosting } = useDeleteJobPosting()
  const { user } = useAuthContext()

  // Close dialog on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDeleteDialog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const toggleExpansion = () => setIsExpanded(!isExpanded)

  const openModal = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const openDeleteDialog = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.stopPropagation()
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
  }

  const editJobPosting = (
    jobPosting: JobPostingType,
    filesToUpload: FileList,
  ) => {
    updateJobPosting(jobPosting)
    Array.from(filesToUpload).forEach((file) => {
      uploadFile({
        jobPostingId: jobPosting.id,
        newJobPostingFile: {
          filename: file.name,
          content: file,
        },
      })
    })
    closeModal()
  }

  const handleDeleteJobPosting = () => {
    deleteJobPosting(jobPosting.id)
    closeDeleteDialog()
  }

  const handleFileUpload = (file: File) => {}

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
          {user?.admin && (
            <div className="absolute top-1 right-2 flex space-x-2">
              <FontAwesomeIcon
                icon={faPencilAlt}
                onClick={openModal}
                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                aria-label="Edit job posting"
              />
              <FontAwesomeIcon
                icon={faTrashAlt}
                onClick={openDeleteDialog}
                className="text-red-600 hover:text-red-800 cursor-pointer"
                aria-label="Delete job posting"
              />
            </div>
          )}
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

            {existingJobPostingFiles && existingJobPostingFiles.length > 0 && (
              <div className="mt-2">
                <h3 className="font-semibold text-gray-800">Filer:</h3>
                <ul className="list-disc list-inside text-gray-800">
                  {existingJobPostingFiles.map((file, index) => (
                    <li key={file.url}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {file.name}
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
          jobPostingFiles={existingJobPostingFiles ? existingJobPostingFiles : []}
          onClose={closeModal}
          onEditJobPosting={editJobPosting}
        />
      )}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800">
              Bekreft sletting
            </h3>
            <p className="text-gray-600">
              Er du sikker på at du vil slette denne utlysningen?
            </p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={closeDeleteDialog}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteJobPosting}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-800 rounded"
              >
                Slett
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
