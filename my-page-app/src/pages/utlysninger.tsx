import JobPostingList from '@/components/jobposting/JobPostingList'
import { JobPostingType } from '@/types'

export default function Utlysninger() {
  const jobPostings: JobPostingType[] = []

  const currentDate = new Date().toISOString().split('T')[0]

  const currentJobPostings = jobPostings.filter(
    (jobPosting) => jobPosting.dueDate >= currentDate,
  )

  const pastJobPostings = jobPostings.filter(
    (jobPosting) => jobPosting.dueDate < currentDate,
  )

  return (
    <div
      className="container"
      style={{
        marginTop: '2rem',
      }}
    >
      <h1
        style={{
          marginBottom: '2rem',
        }}
      >
        Utlysninger
      </h1>
      <h2>Pågående utlysninger</h2>
      {currentJobPostings.length > 0 ? (
        <JobPostingList jobPostings={currentJobPostings} />
      ) : (
        <p
          style={{
            fontStyle: 'italic',
          }}
        >
          Ingen pågående utlysninger
        </p>
      )}
      <h2>Tidligere utlysninger</h2>
      {pastJobPostings.length > 0 ? (
        <JobPostingList jobPostings={pastJobPostings} />
      ) : (
        <p
          style={{
            fontStyle: 'italic',
          }}
        >
          Ingen tidligere utlysninger
        </p>
      )}
    </div>
  )
}
