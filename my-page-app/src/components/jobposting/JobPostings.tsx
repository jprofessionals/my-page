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
              <div className="flex flex-col gap-2 p-4 rounded card-bordered bg-orange-brand">
                <strong className="text-2xl text-white">Teknologier</strong>
                <div className="flex flex-wrap gap-2">
                  {jobPosting.tags?.map((tag) => (
                    <div
                      key={tag}
                      className="py-1 px-2 rounded-lg bg-slate-100"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <h4>Beskrivelse</h4>
              {jobPosting.description ? (
                <p
                  dangerouslySetInnerHTML={{
                    __html: jobPosting.description.replaceAll('\n', '<br/>'),
                  }}
                />
              ) : null}
              <div className="flex flex-col">
                <strong>Krav til erfaring</strong>
                <span>{jobPosting.requiredYearsOfExperience} år</span>
                <strong>Sted</strong>
                <span>{jobPosting.location}</span>
                <strong>Antall ressurser</strong>
                <span>{jobPosting.resourcesNeeded}</span>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Accordion>
  )
}
