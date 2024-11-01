import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import {
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
} from '@/data/types'
import { DateTime } from 'luxon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'

interface JobPostingModalProps {
  jobPosting?: JobPostingType
  jobPostingFiles?: JobPostingFilesType
  heading: string
  submitText: string
  onClose: () => void
  onSubmit: (jobPosting: JobPostingType, newFiles: FileList, filesToDelete: JobPostingFilesType) => void
}

export const JobPostingModal = ({
  jobPosting,
  jobPostingFiles,
  heading,
  submitText,
  onClose,
  onSubmit,
}: JobPostingModalProps) => {
  const [id, setId] = useState(jobPosting ? jobPosting.id : 0)
  const [title, setTitle] = useState(jobPosting ? jobPosting.title : '')
  const [customer, setCustomer] = useState(
    jobPosting ? jobPosting.customer : '',
  )
  const [deadline, setDeadline] = useState(
    jobPosting ? jobPosting.deadline : '',
  )
  const [description, setDescription] = useState(
    jobPosting ? jobPosting.description : '',
  )
  const [files, setFiles] = useState(jobPostingFiles ? jobPostingFiles : [])
  const [filesToUpload, setFilesToUpload] = useState<FileList>(
    new DataTransfer().files,
  )
  const [filesToDelete, setFilesToDelete] = useState<JobPostingFilesType>([])
  const [links, setLinks] = useState(jobPosting ? jobPosting.links : [])
  const [tags, setTags] = useState(jobPosting ? jobPosting.tags : [])

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    const localDateTime = DateTime.fromISO(input)

    const osloDateTime = localDateTime.setZone('Europe/Oslo', {
      keepLocalTime: true,
    })

    const isoWithOffset = osloDateTime.toISO() || ''

    setDeadline(isoWithOffset)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const jobPosting: JobPostingType = {
      id: id,
      title: title,
      customer: customer,
      deadline: deadline,
      description: description,
      links: links,
      tags: tags,
    }
    onSubmit(jobPosting, filesToUpload, filesToDelete)
  }

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl border border-gray-300">
        <h2 className="text-xl font-bold mb-4">{heading}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Tittel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Kunde</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Frist</label>
            <input
              type="datetime-local"
              value={DateTime.fromISO(deadline).toFormat("yyyy-MM-dd'T'HH:mm")}
              onChange={handleDateChange}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Beskrivelse</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Filer</label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setFilesToUpload(e.target.files)
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
            <ul className="mt-2">
              {files.map((file) => (
                <li
                  className="flex justify-between items-center w-full"
                  key={file.blobId}
                >
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-grow text-blue-600 hover:underline"
                  >
                    {file.name}
                  </a>
                  <FontAwesomeIcon
                    icon={faTrashAlt}
                    onClick={() => {
                      setFilesToDelete((prevFiles) => [...prevFiles, file])
                      setFiles((prevFiles) =>
                        prevFiles.filter((f) => f.blobId !== file.blobId),
                      )
                    }}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                    aria-label="Delete file"
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
