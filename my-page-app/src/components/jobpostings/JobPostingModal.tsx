import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { JobPosting as JobPostingType } from '@/data/types'
import { DateTime } from 'luxon'

interface JobPostingModalProps {
  jobPosting?: JobPostingType
  heading: string
  submitText: string
  onClose: () => void
  onSubmit: (jobPosting: JobPostingType) => void
}

export const JobPostingModal = ({
  jobPosting,
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
  const [files, setFiles] = useState(jobPosting ? jobPosting.files : [])
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
      files: files,
      links: links,
      tags: tags,
    }
    onSubmit(jobPosting)
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
            <label className="block text-gray-700">Filer (kommaseparert)</label>
            <input
              type="text"
              value={files}
              onChange={(e) => setFiles(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Lenker (kommaseparert)
            </label>
            <input
              type="text"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tags (kommaseparert)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
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
