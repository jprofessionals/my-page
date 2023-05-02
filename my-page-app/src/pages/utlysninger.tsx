import JobPostingList from '@/components/jobposting/JobPostingList'
import { JobPostingType } from '@/types'
import { useQuery } from 'react-query'
import axios from 'axios'
import { API_URL } from '@/services/api.service'
import authHeader from '@/services/auth-header'

const getAllJobPostings = async () => {
  const response = await axios.get(API_URL + 'jobposting', {
    headers: authHeader(),
  })

  const jobPostings: JobPostingType[] = response.data

  return jobPostings
}

export default function Utlysninger() {
  const { data: jobPostings = [] } = useQuery('jobPostings', getAllJobPostings)

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
