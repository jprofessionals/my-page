import JobPostings from '@/components/jobposting/JobPostings'
import { JobPostingType } from '@/types'
import { useQuery } from 'react-query'
import axios from 'axios'
import { API_URL } from '@/services/api.service'
import authHeader from '@/services/auth-header'
import dynamic from 'next/dynamic'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

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

  const currentJobPostings = jobPostings.filter((jobPosting) => {
    return (
      jobPosting.dueDateForApplication &&
      jobPosting.dueDateForApplication >= currentDate
    )
  })

  const pastJobPostings = jobPostings.filter((jobPosting) => {
    return (
      jobPosting.dueDateForApplication &&
      jobPosting.dueDateForApplication < currentDate
    )
  })

  return (
    <RequireAuth>
      <div className="flex flex-col gap-4 p-4">
        <div className="prose">
          <h1>Utlysninger</h1>
          <h2>Pågående utlysninger</h2>
        </div>
        {currentJobPostings.length > 0 ? (
          <JobPostings jobPostings={currentJobPostings} />
        ) : (
          <p>Ingen pågående utlysninger</p>
        )}
        <span className="prose">
          <h2>Tidligere utlysninger</h2>
        </span>
        {pastJobPostings.length > 0 ? (
          <JobPostings jobPostings={pastJobPostings} />
        ) : (
          <p>Ingen tidligere utlysninger</p>
        )}
      </div>
    </RequireAuth>
  )
}
