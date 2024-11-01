import {
  JobPosting as JobPostingType,
  JobPostingFiles as JobPostingFilesType,
} from '@/data/types'
import { JobPostingModal } from '@/components/jobpostings/JobPostingModal'

interface EditJobPostingModalProps {
  jobPosting: JobPostingType
  jobPostingFiles: JobPostingFilesType
  onClose: () => void
  onEditJobPosting: (updatedJobPosting: JobPostingType, newFiles: FileList, filesToDelete: JobPostingFilesType) => void
}

export const EditJobPostingModal = ({
  jobPosting,
  jobPostingFiles,
  onClose,
  onEditJobPosting,
}: EditJobPostingModalProps) => {
  return (
    <JobPostingModal
      jobPosting={jobPosting}
      jobPostingFiles={jobPostingFiles}
      heading="Endre utlysning"
      submitText="Endre"
      onClose={onClose}
      onSubmit={onEditJobPosting}
    />
  )
}
