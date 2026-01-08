'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SurveyQuestionPreview from './SurveyQuestionPreview'

interface Question {
  id: number
  code: string
  textNo: string
  questionType: 'RATING_1_6' | 'FREE_TEXT'
  category?: string
  required: boolean
}

interface SortableQuestionItemProps {
  id: string
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
  showRatingLabels?: boolean
}

export default function SortableQuestionItem({
  id,
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
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-10' : ''}`}
    >
      {/* Drag handle */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing bg-gray-50 rounded-l-lg border-r border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      )}

      {/* Question content with left padding for drag handle */}
      <div className={disabled ? '' : 'ml-8'}>
        <SurveyQuestionPreview
          question={question}
          customTextNo={customTextNo}
          requiredOverride={requiredOverride}
          ratingLabelLow={ratingLabelLow}
          ratingLabelHigh={ratingLabelHigh}
          commentFieldLabel={commentFieldLabel}
          primaryColor={primaryColor}
          onQuestionTextChange={onQuestionTextChange}
          onRequiredChange={onRequiredChange}
          onRatingLabelLowChange={onRatingLabelLowChange}
          onRatingLabelHighChange={onRatingLabelHighChange}
          onCommentFieldLabelChange={onCommentFieldLabelChange}
          disabled={disabled}
          showRatingLabels={showRatingLabels}
        />
      </div>
    </div>
  )
}
