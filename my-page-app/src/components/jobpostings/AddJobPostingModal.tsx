import {
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
} from '@/data/types'
import { JobPostingModal } from '@/components/jobpostings/JobPostingModal'

interface AddJobPostingModalProps {
  onClose: () => void
  onAddJobPosting: (
    newJobPosting: JobPostingType,
    newFiles: FileList,
    filesToDelete: JobPostingFilesType,
  ) => void
}

export const AddJobPostingModal = ({
  onClose,
  onAddJobPosting,
}: AddJobPostingModalProps) => {
  return (
    <JobPostingModal
      heading="Legg til ny utlysning"
      submitText="Legg til"
      onClose={onClose}
      onSubmit={onAddJobPosting}
    />
  )
}
