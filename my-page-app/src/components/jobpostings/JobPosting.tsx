import { useState } from 'react'
import { JobPostingType } from "@/types/jobPosting";

type PropsType = JobPostingType

export const JobPosting = ({
  title,
  customer,
  deadline,
  tags,
  description,
  files,
  links,
}: PropsType) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpansion = () => setIsExpanded(!isExpanded)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpansion()
    }
  }

  // Format the deadline to Norwegian format
  const formattedDeadline = new Intl.DateTimeFormat('no-NO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Oslo',
  }).format(deadline)

  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <div
        className="relative z-10 flex justify-between items-center p-4 cursor-pointer bg-gray-200 hover:bg-gray-300 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={toggleExpansion}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-700">{customer}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Frist</p>
          <p className="text-sm text-gray-700">{formattedDeadline}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="relative z-0 p-4 bg-white">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-gray-800">{description}</p>

          {files.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold text-gray-800">Filer:</h3>
              <ul className="list-disc list-inside text-gray-800">
                {files.map((file, index) => (
                  <li key={index}>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {file}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {links.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold text-gray-800">Lenker:</h3>
              <ul className="list-disc list-inside text-gray-800">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
