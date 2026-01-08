'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import EditableTextField from './EditableTextField'
import SortableQuestionItem from './SortableQuestionItem'

interface Question {
  id: number
  code: string
  textNo: string
  questionType: 'RATING_1_6' | 'FREE_TEXT'
  category?: string
  required: boolean
}

interface RoundQuestion {
  id: number
  displayOrder: number
  active: boolean
  commentFieldLabel?: string | null
  customTextNo?: string | null
  requiredOverride?: boolean | null
  question: Question
}

interface SurveyPreviewBodyProps {
  surveyName: string
  year: number
  questions: RoundQuestion[]
  introText: string
  instructionText: string
  ratingLabelLow: string
  ratingLabelHigh: string
  defaultCommentFieldLabel: string
  primaryColor: string
  accentBgColor: string
  onIntroTextChange: (value: string) => void
  onInstructionTextChange: (value: string) => void
  onRatingLabelLowChange: (value: string) => void
  onRatingLabelHighChange: (value: string) => void
  onQuestionTextChange: (questionId: number, value: string) => void
  onRequiredChange: (questionId: number, value: boolean) => void
  onCommentFieldLabelChange: (questionId: number, value: string) => void
  onQuestionsReorder?: (questionIds: number[]) => void
  disabled?: boolean
}


export default function SurveyPreviewBody({
  surveyName,
  year,
  questions,
  introText,
  instructionText,
  ratingLabelLow,
  ratingLabelHigh,
  defaultCommentFieldLabel,
  primaryColor,
  accentBgColor,
  onIntroTextChange,
  onInstructionTextChange,
  onRatingLabelLowChange,
  onRatingLabelHighChange,
  onQuestionTextChange,
  onRequiredChange,
  onCommentFieldLabelChange,
  onQuestionsReorder,
  disabled = false,
}: SurveyPreviewBodyProps) {
  // Local state for drag-and-drop ordering
  const [orderedQuestions, setOrderedQuestions] = useState<RoundQuestion[]>([])

  // Update ordered questions when props change
  useEffect(() => {
    const sorted = [...questions].sort((a, b) => a.displayOrder - b.displayOrder)
    setOrderedQuestions(sorted)
  }, [questions])

  // Get sortable IDs
  const questionIds = useMemo(
    () => orderedQuestions.map((rq) => `question-${rq.question.id}`),
    [orderedQuestions]
  )

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = questionIds.indexOf(active.id as string)
      const newIndex = questionIds.indexOf(over.id as string)

      const newOrder = arrayMove(orderedQuestions, oldIndex, newIndex)
      setOrderedQuestions(newOrder)

      // Notify parent of new order
      if (onQuestionsReorder) {
        onQuestionsReorder(newOrder.map((rq) => rq.question.id))
      }
    }
  }

  // Track which rating question is first (to show labels only on first)
  let firstRatingQuestionIndex = -1
  orderedQuestions.forEach((rq, idx) => {
    if (rq.active && rq.question.questionType === 'RATING_1_6' && firstRatingQuestionIndex === -1) {
      firstRatingQuestionIndex = idx
    }
  })

  // Group active questions by category
  const activeQuestions = orderedQuestions.filter((rq) => rq.active)

  return (
    <div className="p-6 space-y-6">
      {/* Survey Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Kundetilfredshetsundersøkelse
        </h1>
        <p className="text-gray-600">
          {surveyName} ({year})
        </p>
      </div>

      {/* Intro text - editable */}
      <div
        className="rounded-lg p-6 text-center"
        style={{ backgroundColor: accentBgColor }}
      >
        <EditableTextField
          value={introText}
          defaultValue="Velkommen til vår kundetilfredshetsundersøkelse..."
          placeholder="Velkomsttekst (valgfritt)"
          onChange={onIntroTextChange}
          disabled={disabled}
          multiline
          textClassName="text-gray-700"
        />
      </div>

      {/* Consultant info placeholder */}
      <div
        className="rounded-lg p-6 text-center"
        style={{ backgroundColor: accentBgColor }}
      >
        <p className="text-gray-600 mb-1">Din tilbakemelding om</p>
        <p className="text-xl font-semibold" style={{ color: primaryColor }}>
          [Konsulentens navn]
        </p>
        <p className="text-gray-500 text-sm mt-1">fra [Kundens organisasjon]</p>
      </div>

      {/* Instructions - editable */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <EditableTextField
          value={instructionText}
          defaultValue="Vennligst vurder konsulentens arbeid på en skala fra 1 til 6, der 1 er svært misfornøyd og 6 er svært fornøyd."
          placeholder="Instruksjonstekst"
          onChange={onInstructionTextChange}
          disabled={disabled}
          multiline
          textClassName="text-gray-600"
        />
        <p className="text-gray-500 mt-2">
          Spørsmål merket med <span className="text-red-500">*</span> er obligatoriske.
        </p>
      </div>

      {/* Questions with drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {activeQuestions.map((rq) => {
              const isFirstRating =
                rq.question.questionType === 'RATING_1_6' &&
                orderedQuestions.indexOf(rq) === firstRatingQuestionIndex

              // Use per-question label if set, otherwise use default
              const questionCommentLabel = rq.commentFieldLabel || defaultCommentFieldLabel

              return (
                <SortableQuestionItem
                  key={rq.question.id}
                  id={`question-${rq.question.id}`}
                  question={rq.question}
                  customTextNo={rq.customTextNo}
                  requiredOverride={rq.requiredOverride}
                  ratingLabelLow={ratingLabelLow}
                  ratingLabelHigh={ratingLabelHigh}
                  commentFieldLabel={questionCommentLabel}
                  primaryColor={primaryColor}
                  onQuestionTextChange={(value) => onQuestionTextChange(rq.question.id, value)}
                  onRequiredChange={(value) => onRequiredChange(rq.question.id, value)}
                  onRatingLabelLowChange={onRatingLabelLowChange}
                  onRatingLabelHighChange={onRatingLabelHighChange}
                  onCommentFieldLabelChange={(value) => onCommentFieldLabelChange(rq.question.id, value)}
                  disabled={disabled}
                  showRatingLabels={isFirstRating}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {activeQuestions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            Ingen aktive spørsmål. Legg til spørsmål i &quot;Spørsmål&quot;-fanen.
          </p>
        </div>
      )}

      {/* Submit button preview */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          disabled
          className="px-8 py-4 rounded-lg text-lg font-semibold text-white cursor-not-allowed opacity-80"
          style={{ backgroundColor: primaryColor }}
        >
          Send inn svar
        </button>
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-gray-400 pt-4 border-t">
        <p>JPro Consulting AS</p>
        <p className="mt-1">Dine svar behandles konfidensielt</p>
      </div>
    </div>
  )
}
