import JobPosting from '@/components/jobposting/JobPosting'
import { JobPostingType } from '@/types'

type Props = {
  jobPostings: JobPostingType[]
}

export default function JobPostingList({ jobPostings }: Props) {
  return (
    <div className="container">
      <div className="row">
        {jobPostings?.map((jobPosting) => (
          <div className="col-12" key={jobPosting.id}>
            <JobPosting jobPosting={jobPosting} />
          </div>
        ))}
      </div>
    </div>
  )
}
