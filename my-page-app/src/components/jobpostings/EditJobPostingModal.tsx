import { JobPosting as JobPostingType } from '@/data/types'
import { JobPostingModal } from '@/components/jobpostings/JobPostingModal'

interface EditJobPostingModalProps {
  jobPosting: JobPostingType
  onClose: () => void
  onEditJobPosting: (updatedJobPosting: JobPostingType) => void
}

export const EditJobPostingModal = ({
  jobPosting,
  onClose,
  onEditJobPosting,
}: EditJobPostingModalProps) => {
  return (
    <JobPostingModal
      jobPosting={jobPosting}
      heading="Endre utlysning"
      submitText="Endre"
      onClose={onClose}
      onSubmit={onEditJobPosting}
    />
  )
}
