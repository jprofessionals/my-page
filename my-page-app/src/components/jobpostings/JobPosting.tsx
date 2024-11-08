import { MouseEventHandler, useState } from 'react'
import {
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
} from '@/data/types'
import { EditJobPostingModal } from '@/components/jobpostings/EditJobPostingModal'
import {
  useDeleteJobPosting,
  useJobPostingFiles,
  usePutJobPosting,
} from '@/hooks/jobPosting'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/providers/AuthProvider'
import * as Accordion from '@radix-ui/react-accordion'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

export const JobPosting = (jobPosting: JobPostingType) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { data: existingJobPostingFiles } = useJobPostingFiles(jobPosting.id)
  const { mutate: updateJobPosting } = usePutJobPosting()
  const { mutate: deleteJobPosting } = useDeleteJobPosting()
  const { user } = useAuthContext()

  const openModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const openDeleteDialog: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
  }

  const editJobPosting = (
    jobPosting: JobPostingType,
    filesToUpload: FileList,
    filesToDelete: JobPostingFilesType,
  ) => {
    updateJobPosting({
      updatedJobPosting: jobPosting,
      filesToUpload: filesToUpload,
      filesToDelete: filesToDelete,
    })
    closeModal()
  }

  const handleDeleteJobPosting = () => {
    deleteJobPosting(jobPosting.id)
    closeDeleteDialog()
  }

  // Format the deadline to Norwegian format
  const formattedDeadline = jobPosting.urgent
    ? 'ASAP'
    : jobPosting.deadline
      ? new Intl.DateTimeFormat('no-NO', {
          dateStyle: 'long',
          timeStyle: 'short',
          timeZone: 'Europe/Oslo',
        }).format(new Date(jobPosting.deadline))
      : 'Ukjent'

  return (
    <>
      <Accordion.Header className="border border-gray-200 rounded-lg mb-4">
        <Accordion.Trigger className="relative p-4 bg-gray-200 hover:bg-gray-300 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
          <div className="flex justify-between">
            <div className="flex flex-col items-start">
              <h2 className="text-xl font-bold text-gray-800">
                {jobPosting.title}
              </h2>
              <p className="text-gray-700">{jobPosting.customer.name}</p>
            </div>

            <div className="flex flex-col items-start w-[200px]">
              <p className="text-sm font-bold text-gray-800">Frist</p>
              <p className="text-sm text-gray-700">{formattedDeadline}</p>
            </div>
          </div>
          {user?.admin && (
            <div className="absolute top-1 right-2 flex space-x-2">
              <button
                onClick={openModal}
                aria-label="Edit job posting"
                className="focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faPencilAlt}
                  className="text-gray-600 hover:text-gray-800"
                />
              </button>
              <button
                onClick={openDeleteDialog}
                aria-label="Delete job posting"
                className="focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faTrashAlt}
                  className="text-red-600 hover:text-red-800"
                />
              </button>
            </div>
          )}
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="p-4 bg-white">
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
        <p className="text-gray-800 whitespace-pre-line">
          {jobPosting.description}
        </p>

        {existingJobPostingFiles && existingJobPostingFiles?.length > 0 && (
          <div className="mt-2">
            <h3 className="font-semibold text-gray-800">Filer:</h3>
            <ul className="list-disc list-inside text-gray-800">
              {existingJobPostingFiles.map((file) => (
                <li key={file.blobId}>
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
      </Accordion.Content>
      {isModalOpen && (
        <EditJobPostingModal
          jobPosting={jobPosting}
          jobPostingFiles={
            existingJobPostingFiles ? existingJobPostingFiles : []
          }
          onClose={closeModal}
          onEditJobPosting={editJobPosting}
        />
      )}
      <AlertDialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <AlertDialog.Content className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
            <AlertDialog.Title className="text-lg font-semibold text-gray-800">
              Bekreft sletting
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600">
              Er du sikker på at du vil slette denne utlysningen?
            </AlertDialog.Description>
            <div className="flex justify-end space-x-4 mt-4">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Avbryt
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDeleteJobPosting}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-800 rounded"
                >
                  Slett
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
