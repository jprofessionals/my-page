'use client'

import {
  Customer,
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
  Tag,
} from '@/data/types'
import { DateTime } from 'luxon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/providers/AuthProvider'
import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'
import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import {
  Autocomplete,
  Chip,
  createFilterOptions,
  TextField,
} from '@mui/material'
import { useJobPostingCustomers, useJobPostingTags } from '@/hooks/jobPosting'
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditor,
  type RichTextEditorRef,
} from 'mui-tiptap'
import { StarterKit } from '@tiptap/starter-kit'

type OnCreateJobPostingType = (
  jobPosting: JobPostingType,
  newFiles: FileList,
  notify: boolean,
) => void

type OnEditJobPostingType = (
  jobPosting: JobPostingType,
  newFiles: FileList,
  filesToDelete: JobPostingFilesType,
  updateMessage: string | null,
) => void

interface JobPostingModalProps {
  jobPosting?: JobPostingType
  jobPostingFiles?: JobPostingFilesType
  heading: string
  submitText: string

  onClose(): void

  onSubmit: OnCreateJobPostingType | OnEditJobPostingType
}

export const JobPostingModal = ({
  jobPosting,
  jobPostingFiles,
  heading,
  submitText,
  onClose,
  onSubmit,
}: JobPostingModalProps) => {
  const { user } = useAuthContext()
  const { data: customers } = useJobPostingCustomers()
  const { data: tagOptions } = useJobPostingTags()
  const [id] = useState(jobPosting ? jobPosting.id : 0)
  const [title, setTitle] = useState(jobPosting ? jobPosting.title : '')
  const [customer, setCustomer] = useState<Customer | null>(
    jobPosting ? jobPosting.customer : null,
  )
  const [isUrgent, setIsUrgent] = useState(
    jobPosting ? jobPosting.urgent : false,
  )
  const [doNotify, setDoNotify] = useState(true)
  const [doSendUpdate, setDoSendUpdate] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [deadline, setDeadline] = useState(
    jobPosting ? (jobPosting.deadline ? jobPosting.deadline : '') : '',
  )
  const [description, setDescription] = useState(
    jobPosting ? jobPosting.description : '',
  )
  const [files, setFiles] = useState(jobPostingFiles ? jobPostingFiles : [])
  const [filesToUpload, setFilesToUpload] = useState<FileList>(
    new DataTransfer().files,
  )
  const [filesToDelete, setFilesToDelete] = useState<JobPostingFilesType>([])
  const [links] = useState(jobPosting ? jobPosting.links : [])
  const [tags, setTags] = useState(jobPosting ? jobPosting.tags : [])
  const [tagInputValue, setTagInputValue] = useState('')
  const rteRef = useRef<RichTextEditorRef>(null)

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

    if (!customer) {
      return
    }

    const newOrUpdatedJobPosting: JobPostingType = {
      id: id,
      title: title,
      customer: customer,
      urgent: isUrgent,
      deadline: deadline,
      description: description,
      links: links,
      tags: tags,
    }

    if (jobPosting) {
      ;(onSubmit as OnEditJobPostingType)(
        newOrUpdatedJobPosting,
        filesToUpload,
        filesToDelete,
        updateMessage,
      )
    } else {
      ;(onSubmit as OnCreateJobPostingType)(
        newOrUpdatedJobPosting,
        filesToUpload,
        doNotify,
      )
    }
  }

  if (!customers) {
    return
  }

  if (!tagOptions) {
    return
  }

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed inset-0 flex justify-center items-center z-50"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl border border-gray-300">
            <Dialog.Title className="text-xl font-bold mb-4">
              {heading}
            </Dialog.Title>
            <Dialog.Description hidden={true}>
              Legg til eller endre utlysninger
            </Dialog.Description>
            <form onSubmit={handleSubmit}>
              <div className="mt-5 mb-4">
                <TextField
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  label="Tittel"
                  variant="outlined"
                  fullWidth
                  required
                />
              </div>
              <div className="mb-4">
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  value={customer}
                  onChange={(event, newValue: Customer | null) => {
                    setCustomer(newValue)
                  }}
                  onInputChange={(event, newInputValue, reason) => {
                    if (reason === 'input') {
                      const matchingCustomer = customers.find(
                        (elem) => elem.name === newInputValue,
                      )

                      if (!matchingCustomer) {
                        const newCustomer: Customer = {
                          id: 0,
                          name: newInputValue,
                          exclusive: false,
                        }

                        setCustomer(newCustomer)
                      }
                    }
                  }}
                  disablePortal
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Kunde"
                      variant="outlined"
                      required
                    />
                  )}
                />
              </div>
              <div className="mb-4 flex gap-4">
                <div className="flex gap-2">
                  <label className="block text-gray-700 mb-1">
                    Levere ASAP?
                  </label>
                  <Switch.Root
                    className={`relative inline-flex items-center h-6 rounded-full w-11 border ${
                      isUrgent
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-400 border-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    id="urgent"
                    checked={isUrgent}
                    onCheckedChange={(checked) => setIsUrgent(checked)}
                  >
                    <Switch.Thumb
                      className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200"
                      style={{
                        transform: isUrgent
                          ? 'translateX(18px)'
                          : 'translateX(0)',
                      }}
                    />
                  </Switch.Root>
                </div>
                {jobPosting ? (
                  <div className="flex gap-2">
                    <label className="block text-gray-700 mb-1">
                      Send oppdatering?
                    </label>
                    <Switch.Root
                      className={`relative inline-flex items-center h-6 rounded-full w-11 border ${
                        doSendUpdate
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-gray-400 border-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      id="notify"
                      checked={doSendUpdate}
                      onCheckedChange={(checked) => {
                        setDoSendUpdate(checked)
                        setUpdateMessage(null)
                      }}
                    >
                      <Switch.Thumb
                        className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200"
                        style={{
                          transform: doSendUpdate
                            ? 'translateX(18px)'
                            : 'translateX(0)',
                        }}
                      />
                    </Switch.Root>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label className="block text-gray-700 mb-1">Varsel?</label>
                    <Switch.Root
                      className={`relative inline-flex items-center h-6 rounded-full w-11 border ${
                        doNotify
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-gray-400 border-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      id="notify"
                      checked={doNotify}
                      onCheckedChange={(checked) => setDoNotify(checked)}
                    >
                      <Switch.Thumb
                        className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200"
                        style={{
                          transform: doNotify
                            ? 'translateX(18px)'
                            : 'translateX(0)',
                        }}
                      />
                    </Switch.Root>
                  </div>
                )}
              </div>
              {doSendUpdate && (
                <div className="mb-4">
                  <TextField
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    label="Oppdatering"
                    variant="outlined"
                    fullWidth
                    required
                  />
                </div>
              )}
              {isUrgent ? null : (
                <div className="mb-4">
                  <label className="block text-gray-700">Frist</label>
                  <input
                    type="datetime-local"
                    value={DateTime.fromISO(deadline).toFormat(
                      "yyyy-MM-dd'T'HH:mm",
                    )}
                    onChange={handleDateChange}
                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <div className="prose max-w-none">
                  <RichTextEditor
                    ref={rteRef}
                    extensions={[StarterKit]}
                    content={description}
                    onUpdate={(e) => {
                      setDescription(e.editor.getHTML())
                    }}
                    renderControls={() => (
                      <MenuControlsContainer>
                        <MenuSelectHeading
                          MenuProps={{
                            disablePortal: true,
                          }}
                        />
                        <MenuDivider />
                        <MenuButtonBold />
                        <MenuButtonItalic />
                      </MenuControlsContainer>
                    )}
                  />
                </div>
              </div>
              <div className="mb-4">
                <Autocomplete
                  multiple
                  options={tagOptions}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                      return option
                    }
                    return option.name
                  }}
                  inputValue={tagInputValue}
                  filterOptions={(options, params) => {
                    const { inputValue } = params
                    const filteredOptions = options.filter((option) => {
                      const optionName =
                        typeof option === 'string' ? option : option.name
                      return !tags.some((tag) => tag.name === optionName)
                    })

                    const filter = createFilterOptions<Tag>()
                    const filtered = filter(filteredOptions, params)

                    const isExistingOption = options.some((option) => {
                      const optionName =
                        typeof option === 'string' ? option : option.name
                      return (
                        optionName.toLowerCase() === inputValue.toLowerCase()
                      )
                    })
                    const isExistingTag = tags.some(
                      (tag) =>
                        tag.name.toLowerCase() === inputValue.toLowerCase(),
                    )

                    if (
                      inputValue !== '' &&
                      !isExistingOption &&
                      !isExistingTag
                    ) {
                      filtered.push({ id: 0, name: inputValue })
                    }

                    return filtered
                  }}
                  freeSolo
                  value={tags}
                  onChange={(event, newValue) => {
                    const updatedTags = newValue.map((item) => {
                      if (typeof item === 'string') {
                        return { id: 0, name: item }
                      }
                      return item
                    })
                    const uniqueTags = updatedTags.filter(
                      (tag, index, self) =>
                        index === self.findIndex((t) => t.name === tag.name),
                    )
                    setTags(uniqueTags)
                    setTagInputValue('')
                  }}
                  onInputChange={(event, newInputValue, reason) => {
                    if (reason === 'input') {
                      setTagInputValue(newInputValue)
                    }
                  }}
                  disablePortal
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return (
                        <Chip key={key} label={option.name} {...tagProps} />
                      )
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Emneknagger"
                      variant="outlined"
                    />
                  )}
                />
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
                      {user?.admin ? (
                        <FontAwesomeIcon
                          icon={faTrashAlt}
                          onClick={() => {
                            setFilesToDelete((prevFiles) => [
                              ...prevFiles,
                              file,
                            ])
                            setFiles((prevFiles) =>
                              prevFiles.filter((f) => f.blobId !== file.blobId),
                            )
                          }}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          aria-label="Delete file"
                        />
                      ) : (
                        <span />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="mr-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Avbryt
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {submitText}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
