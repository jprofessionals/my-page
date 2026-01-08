'use client'

import Image from 'next/image'

interface SurveyPreviewHeaderProps {
  logoUrl?: string | null
  headerBgColor: string
  surveyName: string
  year: number
}

export default function SurveyPreviewHeader({
  logoUrl,
  headerBgColor,
  surveyName,
  year,
}: SurveyPreviewHeaderProps) {
  return (
    <header
      style={{ backgroundColor: headerBgColor }}
      className="shadow-sm rounded-t-lg"
    >
      <div className="px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              className="h-12 object-contain"
            />
          ) : (
            <Image
              src="/images/jpro-logo.svg"
              alt="JPro"
              width={100}
              height={40}
              priority
            />
          )}
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">Kundetilfredshetsundersøkelse</span>
        </div>
      </div>

      {/* Survey name subtitle */}
      <div className="bg-gray-100 px-4 py-2 text-center">
        <span className="text-gray-600 text-sm">
          {surveyName} {year}
        </span>
      </div>
    </header>
  )
}
