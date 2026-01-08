'use client'

import EditableTextField from './EditableTextField'

interface SurveyThankYouPreviewProps {
  thankYouTitle: string
  thankYouMessage: string
  primaryColor: string
  onThankYouTitleChange: (value: string) => void
  onThankYouMessageChange: (value: string) => void
  disabled?: boolean
}

export default function SurveyThankYouPreview({
  thankYouTitle,
  thankYouMessage,
  primaryColor,
  onThankYouTitleChange,
  onThankYouMessageChange,
  disabled = false,
}: SurveyThankYouPreviewProps) {
  return (
    <div className="p-6">
      <div className="text-center py-16">
        {/* Success icon */}
        <svg
          className="w-20 h-20 mx-auto mb-6"
          style={{ color: primaryColor }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Editable thank you title */}
        <div className="mb-4">
          <EditableTextField
            value={thankYouTitle}
            defaultValue="Takk for din tilbakemelding!"
            placeholder="Overskrift for takk-side"
            onChange={onThankYouTitleChange}
            disabled={disabled}
            textClassName="text-3xl font-bold text-gray-800"
          />
        </div>

        {/* Editable thank you message */}
        <div className="max-w-md mx-auto">
          <EditableTextField
            value={thankYouMessage}
            defaultValue="Din vurdering av {consultantName} fra {organizationName} er nå registrert."
            placeholder="Takkemelding (støtter {consultantName} og {organizationName})"
            onChange={onThankYouMessageChange}
            disabled={disabled}
            multiline
            textClassName="text-lg text-gray-600"
          />
        </div>

        {/* Placeholder info */}
        {!disabled && (
          <div className="mt-6 text-sm text-gray-400">
            <p>Tilgjengelige plassholdere:</p>
            <p className="font-mono text-xs mt-1">
              {'{consultantName}'} • {'{organizationName}'}
            </p>
          </div>
        )}

        <p className="text-gray-500 mt-8">Du kan nå lukke denne siden.</p>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 pt-4 border-t">
        <p>JPro Consulting AS</p>
        <p className="mt-1">Dine svar behandles konfidensielt</p>
      </div>
    </div>
  )
}
