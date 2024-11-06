import { JobPostings as JobPostingsType } from '@/data/types'
import { JobPosting } from '@/components/jobpostings/JobPosting'
import * as Accordion from '@radix-ui/react-accordion'

type PropsType = {
  title: string
  jobPostings: JobPostingsType
}

export const JobPostingList = ({ title, jobPostings }: PropsType) => {
  return (
    <>
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      {jobPostings.length > 0 ? (
        <Accordion.Root type="multiple" className="space-y-4">
          {jobPostings.map((jobPosting) => (
            <Accordion.Item
              key={jobPosting.id}
              value={jobPosting.id.toString()}
            >
              <JobPosting {...jobPosting} />
            </Accordion.Item>
          ))}
        </Accordion.Root>
      ) : (
        <p className="mb-3">Ingen utlysninger</p>
      )}
    </>
  )
}
