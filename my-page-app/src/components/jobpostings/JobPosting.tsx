'use client'

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
import {
  faLock,
  faPaperclip,
  faPencilAlt,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/providers/AuthProvider'
import * as Accordion from '@radix-ui/react-accordion'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import { RichTextReadOnly } from 'mui-tiptap'
import { StarterKit } from '@tiptap/starter-kit'

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
    updateMessage: string | null,
  ) => {
    updateJobPosting({
      updatedJobPosting: jobPosting,
      filesToUpload: filesToUpload,
      filesToDelete: filesToDelete,
      updateMessage: updateMessage,
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
      <Accordion.Header className="relative border border-gray-200 rounded-lg">
        <div className="absolute top-1 right-2 flex space-x-2">
          <Link
            href={`?id=${jobPosting.id}`}
            aria-label="Lenke til denne ultysningen"
            title="Lenke til denne ultysningen"
            className="focus:outline-none"
          >
            <FontAwesomeIcon
              icon={faPaperclip}
              className="text-gray-600 hover:text-gray-800"
            />
          </Link>
          {user?.admin && (
            <>
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
            </>
          )}
        </div>

        <Accordion.Trigger className="pt-4 group bg-gray-200 hover:bg-gray-300 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
          <div className="flex flex-col md:flex-row justify-between space-y-5 md:space-y-0">
            <div className="flex flex-col items-start px-4 pb-4">
              <h2
                className={`text-xl text-left font-bold ${
                  jobPosting.hidden ? 'text-gray-500' : 'text-gray-800'
                }`}
              >
                {jobPosting.title}
              </h2>
              <p
                className={`text-left ${
                  jobPosting.hidden ? 'text-gray-500' : 'text-gray-700'
                }`}
              >
                {jobPosting.customer.name}
                {jobPosting.customer.exclusive && (
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <FontAwesomeIcon
                          icon={faLock}
                          aria-label="Krever eksklusivitet"
                          className="text-gray-600 hover:text-gray-800 ml-1 cursor-pointer"
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Content
                        className="bg-black text-white text-xs px-2 py-1 rounded-md shadow-md"
                        side="top"
                        align="center"
                      >
                        Krever eksklusivitet
                        <Tooltip.Arrow className="fill-black" />
                      </Tooltip.Content>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                )}
              </p>
            </div>
            <div className="flex flex-col items-start justify-center w-[230px] pr-4 pl-4 pb-4 mb:pl-0 mb:pb-0">
              <p className="text-sm text-left font-bold text-gray-800">Frist</p>
              <p className="text-sm text-gray-700 text-left">
                {formattedDeadline}
              </p>
            </div>
          </div>
          {jobPosting.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-6 pr-4 pb-2 pt-2 items-center border-t border-orange-300">
              {jobPosting.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="p-4 bg-white">
        <div className="prose max-w-none">
          <RichTextReadOnly
            content={jobPosting.description}
            extensions={[StarterKit]}
          />
        </div>

        {existingJobPostingFiles && existingJobPostingFiles?.length > 0 && (
          <div className="mt-4">
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
