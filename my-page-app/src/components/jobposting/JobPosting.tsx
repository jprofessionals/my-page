import { useState } from 'react'
import styles from './JobPosting.module.scss'
import { JobPostingType } from '@/types'

type Props = {
  jobPosting: JobPostingType
}

export default function JobPosting({ jobPosting }: Props) {
  const [showDetails, setShowDetails] = useState(false)

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }

  // Format the due date in Norwegian format
  const formattedDueDate = new Intl.DateTimeFormat('nb-NO').format(
    new Date(jobPosting.dueDate),
  )

  return (
    <div className={`card mb-3 ${styles.cardClick}`} onClick={toggleDetails}>
      <h3 className="card-title font-weight-bold">{jobPosting.title}</h3>
      <p className="card-text font-weight-bold">Frist: {formattedDueDate}</p>
      {showDetails && (
        <div className="row">
          <div className="col-2">
            <p className="card-text font-weight-bold">Teknologier</p>
          </div>
          <div className="col-10">
            <p className="card-text">{jobPosting.technologies.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
