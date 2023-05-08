import { useState } from 'react'
import styles from './JobPosting.module.scss'
import { JobPostingType } from '@/types'
import { Col, Container, Row } from "react-bootstrap";

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
        <Container>
          <Row>
            <Col xs={2} className={styles.label}>Kunde</Col>
            <Col xs={10} className={styles.value}>{jobPosting.customer}</Col>
          </Row>
          <Row>
            <Col xs={2} className={styles.label}>Beskrivelse</Col>
            <Col xs={10} className={styles.value}>
              {jobPosting.description ?
                <div
                  dangerouslySetInnerHTML={{
                    __html: jobPosting.description.replaceAll('\n', '<br/>')
                  }}
                />
                : null}
            </Col>
          </Row>
          <Row>
            <Col xs={2} className={styles.label}>Krav til erfaring</Col>
            <Col xs={10} className={styles.value}>
              {jobPosting.requiredYearsOfExperience} år
            </Col>
          </Row>
          <Row>
            <Col xs={2} className={styles.label}>Sted</Col>
            <Col xs={10} className={styles.value}>{jobPosting.location}</Col>
          </Row>
          <Row>
            <Col xs={2} className={styles.label}>Antall ressurser</Col>
            <Col xs={10} className={styles.value}>{jobPosting.resourcesNeeded}</Col>
          </Row>
          <Row>
            <Col xs={2} className={styles.label}>Emneknagger</Col>
            <Col xs={10} className={styles.value}>{jobPosting.tags?.join(', ')}</Col>
          </Row>
        </Container>
      )}
    </div>
  )
}
