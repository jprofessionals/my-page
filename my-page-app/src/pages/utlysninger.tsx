import JobPostings from '@/components/jobposting/JobPostings'
import { JobPostingType } from '@/types'
import { useQuery } from 'react-query'
import axios from 'axios'
import { API_URL } from '@/services/api.service'
import authHeader from '@/services/auth-header'
import dynamic from 'next/dynamic'
import moment from 'moment'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

const getAllJobPostings = async () => {
  const response = await axios.get(API_URL + 'jobposting', {
    headers: authHeader(),
  })

  return response.data as JobPostingType[]
}

export default function Utlysninger() {
  const { data: jobPostings = [] } = useQuery('jobPostings', getAllJobPostings)

  const currentDate = new Date().toISOString().split('T')[0]

  const currentJobPostings = jobPostings.filter((jobPosting) =>
    moment(jobPosting.dueDateForApplication).isAfter(currentDate, 'day'),
  )

  const pastJobPostings = jobPostings.filter((jobPosting) =>
    moment(jobPosting.dueDateForApplication).isBefore(currentDate, 'day'),
  )

  return (
    <RequireAuth>
      <div className="flex flex-col gap-4 p-4">
        <div className="prose">
          <h1>Utlysninger</h1>
          <p>
            Her legger vi ut utlysninger som Chat-GPT har omformulert fra
            epost-format til noe vi lettere kan søke gjennom 🤖
          </p>
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
