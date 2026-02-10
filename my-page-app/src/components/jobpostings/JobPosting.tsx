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
  useNotifyJobPosting,
  usePutJobPosting,
} from '@/hooks/jobPosting'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBullhorn,
  faLock,
  faPaperclip,
  faPencilAlt,
  faTrashAlt,
  faLocationDot,
  faCoins,
  faBriefcase,
  faCalendarPlus,
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
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false)
  const { data: existingJobPostingFiles } = useJobPostingFiles(jobPosting.id)
  const { mutate: updateJobPosting } = usePutJobPosting()
  const { mutate: deleteJobPosting } = useDeleteJobPosting()
  const { mutate: notifyJobPosting, isPending: isNotifying } =
    useNotifyJobPosting()
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

  const openNotifyDialog: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setIsNotifyDialogOpen(true)
  }

  const closeNotifyDialog = () => {
    setIsNotifyDialogOpen(false)
  }

  const handleNotifyJobPosting = () => {
    notifyJobPosting(jobPosting.id)
    closeNotifyDialog()
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

  // Source labels in Norwegian
  const sourceLabels: Record<string, string> = {
    DIRECT: 'Direkte fra kunde',
    BROKER: 'Via megler',
    SUPPLIER: 'Via leverandør',
    FRAMEWORK_DIRECT: 'Rammeavtale (direkte)',
    FRAMEWORK_SUBCONTRACTOR: 'Rammeavtale (underlev.)',
    OTHER: 'Annet',
  }

  const formatHourlyRate = (rate: number | undefined) => {
    if (!rate) return null
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(rate)
  }

  return (
    <>
      <Accordion.Header
        className={`relative rounded-lg shadow-sm bg-white overflow-hidden ${
          jobPosting.urgent
            ? 'ring-2 ring-orange-500'
            : 'border border-gray-200'
        }`}
      >
        {/* Urgent badge */}
        {jobPosting.urgent && (
          <div className="absolute top-0 left-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
            HASTER
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-2 right-3 flex space-x-3">
          <Link
            href={`?id=${jobPosting.id}`}
            aria-label="Lenke til denne ultysningen"
            title="Lenke til denne ultysningen"
            className="focus:outline-hidden p-1"
          >
            <FontAwesomeIcon
              icon={faPaperclip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            />
          </Link>
          {user?.admin && (
            <>
              <button
                onClick={openNotifyDialog}
                aria-label="Send til Slack"
                title="Send til Slack"
                className="focus:outline-hidden p-1"
                disabled={isNotifying}
              >
                <FontAwesomeIcon
                  icon={faBullhorn}
                  className={`transition-colors ${isNotifying ? 'text-gray-300' : 'text-blue-500 hover:text-blue-700'}`}
                />
              </button>
              <button
                onClick={openModal}
                aria-label="Edit job posting"
                className="focus:outline-hidden p-1"
              >
                <FontAwesomeIcon
                  icon={faPencilAlt}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                />
              </button>
              <button
                onClick={openDeleteDialog}
                aria-label="Delete job posting"
                className="focus:outline-hidden p-1"
              >
                <FontAwesomeIcon
                  icon={faTrashAlt}
                  className="text-red-400 hover:text-red-600 transition-colors"
                />
              </button>
            </>
          )}
        </div>

        <Accordion.Trigger className="pt-5 group bg-white hover:bg-gray-50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-inset w-full rounded-lg">
          <div className="flex flex-col md:flex-row justify-between">
            {/* Left side - title and customer */}
            <div className="flex flex-col items-start px-4 pb-3">
              <h2
                className={`text-lg text-left font-semibold select-text cursor-text ${
                  jobPosting.hidden ? 'text-gray-400' : 'text-gray-900'
                }`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {jobPosting.title}
              </h2>
              <p
                className={`text-sm text-left mt-0.5 select-text cursor-text ${
                  jobPosting.hidden ? 'text-gray-400' : 'text-gray-600'
                }`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {jobPosting.customer.name}
                {jobPosting.customer.exclusive && (
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <FontAwesomeIcon
                          icon={faLock}
                          aria-label="Krever eksklusivitet"
                          className="text-amber-500 hover:text-amber-600 ml-1.5 cursor-pointer text-xs"
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Content
                        className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg"
                        side="top"
                        align="center"
                      >
                        Krever eksklusivitet
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                )}
              </p>
            </div>

            {/* Right side - metadata */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center px-4 pb-3 md:pr-20">
              {/* Deadline */}
              <div className="flex flex-col items-start">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Frist
                </p>
                <p
                  className={`text-sm font-medium ${
                    jobPosting.urgent ? 'text-orange-600' : 'text-gray-700'
                  }`}
                >
                  {formattedDeadline}
                </p>
              </div>

              {/* Created date */}
              {jobPosting.created_date && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FontAwesomeIcon
                    icon={faCalendarPlus}
                    className="text-gray-400 text-xs"
                  />
                  <span className="text-sm">
                    {new Intl.DateTimeFormat('no-NO', {
                      dateStyle: 'medium',
                    }).format(new Date(jobPosting.created_date))}
                  </span>
                </div>
              )}

              {/* Location - if available */}
              {jobPosting.location && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-gray-400 text-xs"
                  />
                  <span className="text-sm">{jobPosting.location}</span>
                </div>
              )}

              {/* Hourly rate - if available */}
              {jobPosting.estimated_hourly_rate && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FontAwesomeIcon
                    icon={faCoins}
                    className="text-gray-400 text-xs"
                  />
                  <span className="text-sm">
                    {formatHourlyRate(jobPosting.estimated_hourly_rate)}/t
                  </span>
                </div>
              )}

              {/* Source - if available and user is admin */}
              {user?.admin && jobPosting.source && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="text-gray-400 text-xs"
                  />
                  <span className="text-sm">
                    {sourceLabels[jobPosting.source] || jobPosting.source}
                    {jobPosting.intermediary && (
                      <span className="text-gray-500">
                        {' '}
                        ({jobPosting.intermediary})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags section */}
          {jobPosting.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3 pt-2 border-t border-gray-100">
              {jobPosting.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="px-4 pb-4 pt-0 bg-white border-x border-b border-gray-200 rounded-b-lg -mt-1">
        <div className="pt-4 border-t border-gray-100">
          <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-blue-600">
            <RichTextReadOnly
              content={jobPosting.description}
              extensions={[StarterKit]}
            />
          </div>

          {existingJobPostingFiles && existingJobPostingFiles?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Vedlegg
              </h3>
              <div className="flex flex-wrap gap-2">
                {existingJobPostingFiles.map((file) => (
                  <a
                    key={file.blobId}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faPaperclip}
                      className="text-gray-400 text-xs"
                    />
                    {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {jobPosting.links.length > 0 && user?.admin && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Lenker (kun synlig for admin)
              </h3>
              <ul className="space-y-1">
                {jobPosting.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
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
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-800 rounded-sm"
                >
                  Slett
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <AlertDialog.Root
        open={isNotifyDialogOpen}
        onOpenChange={setIsNotifyDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
          <AlertDialog.Content className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
            <AlertDialog.Title className="text-lg font-semibold text-gray-800">
              Send til Slack
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600">
              Vil du sende denne utlysningen til Slack-kanalen?
            </AlertDialog.Description>
            <div className="flex justify-end space-x-4 mt-4">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Avbryt
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleNotifyJobPosting}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-800 rounded-sm"
                >
                  Send
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
