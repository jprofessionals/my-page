'use client'

import {
  Customer,
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
  JobPostingSource,
  Tag,
} from '@/data/types'
import { DateTime } from 'luxon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusSquare, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/providers/AuthProvider'
import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
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
  const [isHidden, setIsHidden] = useState(
    jobPosting ? jobPosting.hidden : false,
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
  const [links, setLinks] = useState(jobPosting ? jobPosting.links : [])
  const [linkToAddURL, setLinkToAddURL] = useState('')
  const [tags, setTags] = useState(jobPosting ? jobPosting.tags : [])
  const [tagInputValue, setTagInputValue] = useState('')
  const [source, setSource] = useState<JobPostingSource | undefined>(
    jobPosting?.source ?? undefined,
  )
  const [estimatedHourlyRate, setEstimatedHourlyRate] = useState<string>(
    jobPosting?.estimated_hourly_rate?.toString() ?? '',
  )
  const [location, setLocation] = useState<string>(jobPosting?.location ?? '')
  const [intermediary, setIntermediary] = useState<string>(
    jobPosting?.intermediary ?? '',
  )
  const rteRef = useRef<RichTextEditorRef>(null)

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Combine date with current time selection
    const currentTime = deadline
      ? DateTime.fromISO(deadline).toFormat('HH:mm')
      : '12:00'
    const combined = `${input}T${currentTime}`

    const localDateTime = DateTime.fromISO(combined)

    const osloDateTime = localDateTime.setZone('Europe/Oslo', {
      keepLocalTime: true,
    })

    const isoWithOffset = osloDateTime.toISO() || ''

    setDeadline(isoWithOffset)
  }

  const handleTimeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const time = e.target.value
    const currentDate = deadline
      ? DateTime.fromISO(deadline).toFormat('yyyy-MM-dd')
      : DateTime.now().toFormat('yyyy-MM-dd')
    const combined = `${currentDate}T${time}`

    const localDateTime = DateTime.fromISO(combined)

    const osloDateTime = localDateTime.setZone('Europe/Oslo', {
      keepLocalTime: true,
    })

    const isoWithOffset = osloDateTime.toISO() || ''

    setDeadline(isoWithOffset)
  }

  // Generate time options in 30-minute intervals
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2)
    const minutes = (i % 2) * 30
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  })

  // Check if deadline is more than 6 months in the future
  const deadlineWarning = useMemo(() => {
    if (!deadline) return null
    const deadlineDate = DateTime.fromISO(deadline)
    const sixMonthsFromNow = DateTime.now().plus({ months: 6 })
    if (deadlineDate > sixMonthsFromNow) {
      return `Fristen er satt til ${deadlineDate.toFormat('dd.MM.yyyy')} - er du sikker på at årstallet er riktig?`
    }
    return null
  }, [deadline])

  // Keyword to tag mappings - suggests these tag names when keywords are found
  const keywordToTagSuggestions: Record<string, string[]> = {
    // Backend keywords -> suggest these tags
    'api': ['Backend'],
    'rest': ['Backend'],
    'graphql': ['Backend'],
    'server': ['Backend'],
    'mikrotjenester': ['Backend'],
    'microservices': ['Backend'],
    'integrasjon': ['Backend'],
    // Frontend keywords
    'ui': ['Frontend'],
    'ux': ['Frontend'],
    'css': ['Frontend'],
    'html': ['Frontend'],
    'brukergrensesnitt': ['Frontend'],
    'react': ['Frontend', 'JavaScript'],
    'angular': ['Frontend', 'JavaScript'],
    'vue': ['Frontend', 'JavaScript'],
    'javascript': ['Frontend', 'JavaScript'],
    'typescript': ['Frontend', 'JavaScript'],
    // Fullstack
    'fullstack': ['Fullstack'],
    'full-stack': ['Fullstack'],
    'full stack': ['Fullstack'],
    // Data
    'database': ['Data'],
    'sql': ['Data'],
    'etl': ['Data'],
    'datawarehouse': ['Data'],
    'datalake': ['Data'],
    'dataplattform': ['Data'],
    // Analyse
    'analyse': ['Analyse'],
    'analytics': ['Analyse'],
    'bi': ['Analyse'],
    'business intelligence': ['Analyse'],
    'rapportering': ['Analyse'],
    'dashboard': ['Analyse'],
    'power bi': ['Analyse'],
    'tableau': ['Analyse'],
    // Java/Kotlin
    'java': ['Java'],
    'spring': ['Java', 'Backend'],
    'spring boot': ['Java', 'Backend'],
    'maven': ['Java'],
    'gradle': ['Java', 'Kotlin'],
    'hibernate': ['Java', 'Backend'],
    'kotlin': ['Kotlin', 'Java'],
    'ktor': ['Kotlin', 'Backend'],
    // .NET
    '.net': ['.NET'],
    'dotnet': ['.NET'],
    'c#': ['.NET'],
    'csharp': ['.NET'],
    'asp.net': ['.NET', 'Backend'],
    'blazor': ['.NET', 'Frontend'],
    'entity framework': ['.NET', 'Backend'],
    // Python
    'python': ['Python'],
    'django': ['Python', 'Backend'],
    'flask': ['Python', 'Backend'],
    'fastapi': ['Python', 'Backend'],
    // Cloud
    'azure': ['Azure', 'Sky'],
    'aws': ['AWS', 'Sky'],
    'amazon': ['AWS', 'Sky'],
    'gcp': ['GCP', 'Sky'],
    'google cloud': ['GCP', 'Sky'],
    // DevOps
    'devops': ['DevOps'],
    'ci/cd': ['DevOps'],
    'jenkins': ['DevOps'],
    'github actions': ['DevOps'],
    'gitlab': ['DevOps'],
    'terraform': ['DevOps', 'Sky'],
    'kubernetes': ['DevOps', 'Sky'],
    'k8s': ['DevOps', 'Sky'],
    'docker': ['DevOps'],
    // Andre
    'arkitekt': ['Arkitekt'],
    'architect': ['Arkitekt'],
    'arkitektur': ['Arkitekt'],
    'løsningsarkitekt': ['Arkitekt'],
    'sikkerhet': ['Sikkerhet'],
    'security': ['Sikkerhet'],
    'mobil': ['Mobil'],
    'mobile': ['Mobil'],
    'ios': ['Mobil'],
    'android': ['Mobil', 'Kotlin'],
    'app': ['Mobil'],
    'test': ['Test'],
    'qa': ['Test'],
    'testing': ['Test'],
    'agile': ['Agile'],
    'scrum': ['Agile'],
  }

  // Suggest tags based on title and description content
  const suggestedTags = useMemo(() => {
    const textToAnalyze = `${title} ${description}`.toLowerCase()

    if (textToAnalyze.trim().length < 3) return []

    const suggestedTagNames = new Map<string, string>() // lowercase -> proper case

    // Find keywords in text and collect suggested tag names
    for (const [keyword, tagNames] of Object.entries(keywordToTagSuggestions)) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        tagNames.forEach((name) => {
          if (!suggestedTagNames.has(name.toLowerCase())) {
            suggestedTagNames.set(name.toLowerCase(), name)
          }
        })
      }
    }

    // Also do direct matching with existing tag names from database
    if (tagOptions) {
      tagOptions.forEach((tag) => {
        if (textToAnalyze.includes(tag.name.toLowerCase())) {
          suggestedTagNames.set(tag.name.toLowerCase(), tag.name)
        }
      })
    }

    // Filter out already selected tags and build suggestions
    const suggestions: Tag[] = []

    suggestedTagNames.forEach((properName, lowerName) => {
      // Skip if already selected
      if (tags.some((t) => t.name.toLowerCase() === lowerName)) {
        return
      }

      // Check if tag exists in tagOptions (use existing tag with its ID)
      const existingTag = tagOptions?.find(
        (t) => t.name.toLowerCase() === lowerName
      )

      if (existingTag) {
        suggestions.push(existingTag)
      } else {
        // Suggest creating a new tag
        suggestions.push({ id: 0, name: properName })
      }
    })

    return suggestions.slice(0, 5)
  }, [title, description, tagOptions, tags])

  const addSuggestedTag = (tag: Tag) => {
    if (!tags.some((t) => t.name === tag.name)) {
      setTags([...tags, tag])
    }
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
      hidden: isHidden,
      deadline: deadline || undefined,  // Send undefined instead of empty string
      description: description,
      links: links,
      tags: tags,
      source: source,
      estimated_hourly_rate: estimatedHourlyRate
        ? parseFloat(estimatedHourlyRate)
        : undefined,
      location: location || undefined,
      intermediary: intermediary || undefined,
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

              {/* New analytics fields */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Autocomplete
                  options={[
                    { value: 'DIRECT', label: 'Direkte fra kunde' },
                    { value: 'BROKER', label: 'Via megler' },
                    { value: 'SUPPLIER', label: 'Via leverandør' },
                    { value: 'FRAMEWORK_DIRECT', label: 'Rammeavtale (direkte)' },
                    { value: 'FRAMEWORK_SUBCONTRACTOR', label: 'Rammeavtale (underleverandør)' },
                    { value: 'OTHER', label: 'Annet' },
                  ]}
                  getOptionLabel={(option) => option.label}
                  value={
                    source
                      ? {
                          value: source,
                          label:
                            source === 'DIRECT'
                              ? 'Direkte fra kunde'
                              : source === 'BROKER'
                                ? 'Via megler'
                                : source === 'SUPPLIER'
                                  ? 'Via leverandør'
                                  : source === 'FRAMEWORK_DIRECT'
                                    ? 'Rammeavtale (direkte)'
                                    : source === 'FRAMEWORK_SUBCONTRACTOR'
                                      ? 'Rammeavtale (underleverandør)'
                                      : 'Annet',
                        }
                      : null
                  }
                  onChange={(event, newValue) => {
                    setSource(
                      newValue
                        ? (newValue.value as JobPostingSource)
                        : undefined,
                    )
                    // Clear intermediary when changing source
                    if (
                      !newValue ||
                      !['BROKER', 'SUPPLIER', 'FRAMEWORK_SUBCONTRACTOR'].includes(
                        newValue.value,
                      )
                    ) {
                      setIntermediary('')
                    }
                  }}
                  disablePortal
                  renderInput={(params) => (
                    <TextField {...params} label="Kilde" variant="outlined" />
                  )}
                />
                <TextField
                  value={estimatedHourlyRate}
                  onChange={(e) => setEstimatedHourlyRate(e.target.value)}
                  label="Estimert timepris (kr)"
                  variant="outlined"
                  type="number"
                  inputProps={{ min: 0, step: 50 }}
                />
                <TextField
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  label="Sted"
                  variant="outlined"
                  placeholder="F.eks. Oslo, Remote, Hybrid"
                />
              </div>

              {/* Intermediary field - shown when source is BROKER, SUPPLIER, or FRAMEWORK_SUBCONTRACTOR */}
              {source &&
                ['BROKER', 'SUPPLIER', 'FRAMEWORK_SUBCONTRACTOR'].includes(
                  source,
                ) && (
                  <div className="mb-4">
                    <TextField
                      value={intermediary}
                      onChange={(e) => setIntermediary(e.target.value)}
                      label={
                        source === 'BROKER'
                          ? 'Megler'
                          : source === 'SUPPLIER'
                            ? 'Leverandør'
                            : 'Rammeavtaleholder'
                      }
                      variant="outlined"
                      fullWidth
                      placeholder={
                        source === 'BROKER'
                          ? 'Navn på megler (f.eks. Experis)'
                          : source === 'SUPPLIER'
                            ? 'Navn på leverandør'
                            : 'Hvem har rammeavtalen?'
                      }
                    />
                  </div>
                )}

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
                    } focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                <div className="flex gap-2">
                  <label className="block text-gray-700 mb-1">
                    Skjule for ansatte?
                  </label>
                  <Switch.Root
                    className={`relative inline-flex items-center h-6 rounded-full w-11 border ${
                      isHidden
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-400 border-gray-400'
                    } focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    id="urgent"
                    checked={isHidden}
                    onCheckedChange={(checked) => {
                      setIsHidden(checked)
                      setDoNotify(false)
                      setDoSendUpdate(false)
                      setUpdateMessage(null)
                    }}
                  >
                    <Switch.Thumb
                      className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200"
                      style={{
                        transform: isHidden
                          ? 'translateX(18px)'
                          : 'translateX(0)',
                      }}
                    />
                  </Switch.Root>
                </div>
                {isHidden ? null : jobPosting ? (
                  <div className="flex gap-2">
                    <label className="block text-gray-700 mb-1">
                      Send oppdatering?
                    </label>
                    <Switch.Root
                      className={`relative inline-flex items-center h-6 rounded-full w-11 border ${
                        doSendUpdate
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-gray-400 border-gray-400'
                      } focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                      } focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                  <div className="flex gap-2 mt-1">
                    <input
                      type="date"
                      value={
                        deadline
                          ? DateTime.fromISO(deadline).toFormat('yyyy-MM-dd')
                          : ''
                      }
                      onChange={handleDateChange}
                      className="flex-1 border border-gray-300 rounded p-2"
                      required
                    />
                    <select
                      value={
                        deadline
                          ? DateTime.fromISO(deadline).toFormat('HH:mm')
                          : '12:00'
                      }
                      onChange={handleTimeChange}
                      className="w-28 border border-gray-300 rounded p-2"
                      required
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  {deadlineWarning && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                      ⚠️ {deadlineWarning}
                    </div>
                  )}
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
                {suggestedTags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500 mr-2">Forslag:</span>
                    <div className="inline-flex flex-wrap gap-1">
                      {suggestedTags.map((tag) => (
                        <button
                          key={tag.name}
                          type="button"
                          onClick={() => addSuggestedTag(tag)}
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          + {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

              {user?.admin ? (
                <div className="mb-4">
                  <label className="block text-gray-700">Lenker</label>
                  <div className="w-full flex space-x-2 items-center">
                    <TextField
                      onChange={(e) => setLinkToAddURL(e.target.value)}
                      label="URL"
                      variant="outlined"
                      fullWidth
                    />
                    <FontAwesomeIcon
                      icon={faPlusSquare}
                      onClick={() => {
                        setLinks((prevLinks) => [...prevLinks, linkToAddURL])
                      }}
                      className="cursor-pointer fa-xl"
                      aria-label="Add link"
                    />
                  </div>
                  <ul className="mt-2">
                    {links.map((link, index) => (
                      <li
                        className="flex justify-between items-center w-full"
                        key={`link-${index}`}
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-grow text-blue-600 hover:underline"
                        >
                          {link}
                        </a>
                        <FontAwesomeIcon
                          icon={faTrashAlt}
                          onClick={() => {
                            setLinks((prevLinks) =>
                              prevLinks.filter((l) => l !== link),
                            )
                          }}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          aria-label="Delete link"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <span />
              )}
              <div className="flex justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="mr-4 px-4 py-2 bg-gray-200 rounded-sm hover:bg-gray-300"
                  >
                    Avbryt
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
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
