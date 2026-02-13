'use client'

import EditableTextField from './EditableTextField'

interface Question {
  id: number
  code: string
  textNo: string
  questionType: 'RATING_1_6' | 'FREE_TEXT'
  category?: string
  required: boolean
}

interface SurveyQuestionPreviewProps {
  question: Question
  customTextNo?: string | null
  requiredOverride?: boolean | null
  ratingLabelLow: string
  ratingLabelHigh: string
  commentFieldLabel: string
  primaryColor: string
  onQuestionTextChange: (value: string) => void
  onRequiredChange: (value: boolean) => void
  onRatingLabelLowChange: (value: string) => void
  onRatingLabelHighChange: (value: string) => void
  onCommentFieldLabelChange: (value: string) => void
  disabled?: boolean
  showRatingLabels?: boolean // Only show rating labels on first rating question
}

export default function SurveyQuestionPreview({
  question,
  customTextNo,
  requiredOverride,
  ratingLabelLow,
  ratingLabelHigh,
  commentFieldLabel,
  primaryColor,
  onQuestionTextChange,
  onRequiredChange,
  onRatingLabelLowChange,
  onRatingLabelHighChange,
  onCommentFieldLabelChange,
  disabled = false,
  showRatingLabels = true,
}: SurveyQuestionPreviewProps) {
  // Effective required: use override if set, otherwise use question default
  const effectiveRequired = requiredOverride ?? question.required
  const hasTextOverride = customTextNo && customTextNo !== question.textNo

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Warning about text changes affecting comparability */}
      {hasTextOverride && !disabled && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-start gap-2">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>
            Endret spørsmålstekst kan gjøre det vanskeligere å sammenligne
            resultater med tidligere år.
          </span>
        </div>
      )}

      {/* Question text - editable */}
      <div className="mb-3">
        <div className="flex items-start gap-1">
          <EditableTextField
            value={customTextNo || ''}
            defaultValue={question.textNo}
            placeholder="Spørsmålstekst"
            onChange={onQuestionTextChange}
            disabled={disabled}
            textClassName="text-gray-800"
          />
          {effectiveRequired && <span className="text-red-500">*</span>}
        </div>
      </div>

      {/* Required toggle */}
      {!disabled && (
        <div className="mb-3 flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveRequired}
              onChange={(e) => onRequiredChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
          <span className="text-sm text-gray-600">
            Obligatorisk
            {requiredOverride !== null &&
              requiredOverride !== undefined &&
              requiredOverride !== question.required && (
                <span className="text-amber-600 ml-1">
                  (endret fra standard)
                </span>
              )}
          </span>
        </div>
      )}

      {/* Question type specific rendering */}
      {question.questionType === 'RATING_1_6' && (
        <div className="mt-3">
          {/* Rating labels - editable */}
          {showRatingLabels && (
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <EditableTextField
                value={ratingLabelLow}
                defaultValue="1 - Svært misfornøyd"
                placeholder="Rating label (lav)"
                onChange={onRatingLabelLowChange}
                disabled={disabled}
                textClassName="text-xs text-gray-500"
              />
              <EditableTextField
                value={ratingLabelHigh}
                defaultValue="6 - Svært fornøyd"
                placeholder="Rating label (høy)"
                onChange={onRatingLabelHighChange}
                disabled={disabled}
                textClassName="text-xs text-gray-500"
              />
            </div>
          )}

          {/* Rating buttons (preview only, not interactive) */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <div
                key={value}
                className="w-10 h-10 rounded-lg text-lg font-medium flex items-center justify-center bg-gray-100 text-gray-700"
              >
                {value}
              </div>
            ))}
          </div>

          {/* Show what selected looks like */}
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-400">
              (eksempel på valgt:
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded text-white text-sm ml-1"
                style={{ backgroundColor: primaryColor }}
              >
                4
              </span>
              )
            </span>
          </div>
        </div>
      )}

      {question.questionType === 'FREE_TEXT' && (
        <div className="mt-3">
          <textarea
            rows={3}
            disabled
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-400 resize-none"
            placeholder={commentFieldLabel || 'Skriv din kommentar her...'}
          />
          <div className="mt-1">
            <EditableTextField
              value={commentFieldLabel}
              defaultValue="Skriv din kommentar her..."
              placeholder="Kommentarfelt placeholder"
              onChange={onCommentFieldLabelChange}
              disabled={disabled}
              textClassName="text-xs text-gray-400"
            />
          </div>
        </div>
      )}
    </div>
  )
}
