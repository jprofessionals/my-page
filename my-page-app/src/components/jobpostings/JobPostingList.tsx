import { JobPostings as JobPostingsType } from '@/data/types'
import * as Accordion from '@radix-ui/react-accordion'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { JobPosting } from '@/components/jobpostings/JobPosting'

type PropsType = {
  title: string
  jobPostings: JobPostingsType
}

export const JobPostingList = ({ title, jobPostings }: PropsType) => {
  const router = useRouter()
  const [openItems, setOpenItems] = useState<string[]>([])
  const hasScrolledRef = useRef(false)

  const { id } = router.query

  useEffect(() => {
    if (id) {
      const idStr = Array.isArray(id) ? id[0] : id
      setOpenItems((prev) => [...prev, idStr])
    }
  }, [id])

  useEffect(() => {
    if (
      id &&
      !hasScrolledRef.current &&
      openItems.includes(Array.isArray(id) ? id[0] : id) &&
      jobPostings.length > 0
    ) {
      const idStr = Array.isArray(id) ? id[0] : id
      const el = document.getElementById(`jobposting-${idStr}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        hasScrolledRef.current = true
      }
    }
  }, [openItems, id, jobPostings])

  return (
    <>
      <h2 className="text-2xl font-bold mb-5">{title}</h2>
      {jobPostings.length > 0 ? (
        <Accordion.Root
          type="multiple"
          className="space-y-4"
          value={openItems}
          onValueChange={setOpenItems}
        >
          {jobPostings.map((jobPosting) => (
            <Accordion.Item
              value={jobPosting.id.toString()}
              key={jobPosting.id}
              id={`jobposting-${jobPosting.id}`}
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
