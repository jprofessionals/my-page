import { JobPostingType } from '@/types'
import * as Accordion from '../ui/accordion'

type Props = {
  jobPostings: JobPostingType[]
}

const formattedDueDate = (dueDate?: string) => {
  if (!dueDate) {
    return 'Ugyldig dato'
  }

  return new Intl.DateTimeFormat('nb-NO').format(new Date(dueDate))
}
export default function JobPostingList({ jobPostings }: Props) {
  return (
    <Accordion.Accordion type="multiple" className="flex flex-col gap-4">
      {jobPostings?.map((jobPosting, index) => (
        <Accordion.Item
          value={`${String(jobPosting.id)}-${index}`}
          key={`${String(jobPosting.id)}-${index}`}
          className="card card-bordered"
        >
          <Accordion.Trigger className="flex-row items-center px-4">
            <span className="flex flex-col text-left">
              <span className="card-title">{jobPosting.title}</span>
              Frist: {formattedDueDate(jobPosting.dueDateForApplication)}
            </span>
          </Accordion.Trigger>
          <Accordion.Content>
            <div className="px-4 prose">
              <h4 className="flex flex-col">
                Kunde
                <span className="text-2xl font-light">
                  {jobPosting.customer}
                </span>
              </h4>
              <h4>Beskrivelse</h4>
              <p>
                {jobPosting.description ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: jobPosting.description.replaceAll('\n', '<br/>'),
                    }}
                  />
                ) : null}
              </p>
              <div className="flex flex-col">
                <strong>Krav til erfaring</strong>
                <span>{jobPosting.requiredYearsOfExperience} år</span>
                <strong>Sted</strong>
                <span>{jobPosting.location}</span>
                <strong>Antall ressurser</strong>
                <span>{jobPosting.resourcesNeeded}</span>
                <strong>Emneknagger</strong>
                <span>{jobPosting.tags?.join(', ')}</span>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Accordion>
  )
}
