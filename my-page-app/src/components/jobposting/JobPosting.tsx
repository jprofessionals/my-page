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
  const formattedDueDate = () => {
    if (!jobPosting.dueDateForApplication) {
      return 'Ugyldig dato'
    }

    return new Intl.DateTimeFormat('nb-NO').format(
      new Date(jobPosting.dueDateForApplication),
    )
  }

  return (
    <div className={`card mb-3 ${styles.cardClick}`} onClick={toggleDetails}>
      <h3 className="card-title font-weight-bold">{jobPosting.title}</h3>
      <p className="card-text font-weight-bold">Frist: {formattedDueDate()}</p>
      {showDetails && (
        <div className="row">
          <div className="col-2">
            <p className="card-text font-weight-bold">Kunde</p>
            <p className="card-text font-weight-bold">Beskrivelse</p>
            <p className="card-text font-weight-bold">Krav til erfaring</p>
            <p className="card-text font-weight-bold">Sted</p>
            <p className="card-text font-weight-bold">Antall ressurser</p>
            <p className="card-text font-weight-bold">Emneknagger</p>
          </div>
          <div className="col-10">
            <p className="card-text">{jobPosting.customer}</p>
            <p className="card-text">{jobPosting.description}</p>
            <p className="card-text">
              {jobPosting.requiredYearsOfExperience} år
            </p>
            <p className="card-text">{jobPosting.location}</p>
            <p className="card-text">{jobPosting.resourcesNeeded}</p>
            <p className="card-text">{jobPosting.tags?.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
