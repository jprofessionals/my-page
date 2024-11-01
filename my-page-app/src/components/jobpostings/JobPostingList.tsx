import { JobPostings as JobPostingsType } from '@/data/types'
import { JobPosting } from '@/components/jobpostings/JobPosting'

type PropsType = {
  title: string
  jobPostings: JobPostingsType
}

export const JobPostingList = ({ title, jobPostings }: PropsType) => {
  return (
    <>
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      {jobPostings.length > 0 ? (
        <ul className="space-y-4">
          {jobPostings.map((jobPosting) => (
            <li key={jobPosting.id}>
              <JobPosting {...jobPosting} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3">Ingen utlysninger</p>
      )}
    </>
  )
}
