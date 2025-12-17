'use client'

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import ktiPublicService, {
  PublicSurveyData,
  PublicSurveyQuestion,
  SurveyResponseItem,
} from '@/services/kti-public.service'

// Category translations from English to Norwegian
const categoryTranslations: Record<string, string> = {
  'DELIVERY': 'Leveranse',
  'COMPETENCE': 'Kompetanse',
  'COLLABORATION': 'Samarbeid',
  'KNOWLEDGE_SHARING': 'Kunnskapsdeling',
  'VALUE': 'Verdiskaping',
  'JPRO_FOLLOWUP': 'Oppfølging fra JPro',
  'ADDITIONAL': 'Tilleggsspørsmål',
}

const translateCategory = (category: string): string => {
  return categoryTranslations[category] || category
}

type SurveyState =
  | 'loading'
  | 'ready'
  | 'submitting'
  | 'submitted'
  | 'already_responded'
  | 'not_found'
  | 'error'

export default function PublicSurveyPage() {
  const router = useRouter()
  const { token } = router.query

  const [state, setState] = useState<SurveyState>('loading')
  const [surveyData, setSurveyData] = useState<PublicSurveyData | null>(null)
  const [responses, setResponses] = useState<Record<number, SurveyResponseItem>>({})
  const [error, setError] = useState<string | null>(null)

  // Load survey data when token is available
  useEffect(() => {
    if (!token || typeof token !== 'string') return

    const loadSurvey = async () => {
      try {
        const result = await ktiPublicService.getSurvey(token)

        if (result.error) {
          if (result.response?.status === 410) {
            // Survey already completed
            setState('already_responded')
            if (result.data) {
              setSurveyData(result.data)
            }
          } else if (result.response?.status === 404) {
            setState('not_found')
          } else {
            setState('error')
            setError('Kunne ikke laste undersøkelsen')
          }
          return
        }

        if (result.data) {
          setSurveyData(result.data)
          if (result.data.alreadyResponded) {
            setState('already_responded')
          } else {
            setState('ready')
            // Initialize empty responses
            const initialResponses: Record<number, SurveyResponseItem> = {}
            result.data.questions.forEach((q) => {
              initialResponses[q.id] = { questionId: q.id }
            })
            setResponses(initialResponses)
          }
        }
      } catch {
        setState('error')
        setError('En feil oppstod ved lasting av undersøkelsen')
      }
    }

    loadSurvey()
  }, [token])

  const handleRatingChange = (questionId: number, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], questionId, ratingValue: value },
    }))
  }

  const handleTextChange = (questionId: number, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], questionId, textValue: value },
    }))
  }

  const isFormValid = (): boolean => {
    if (!surveyData) return false

    for (const question of surveyData.questions) {
      if (question.required) {
        const response = responses[question.id]
        if (!response) return false

        if (question.questionType === 'FREE_TEXT') {
          if (!response.textValue?.trim()) return false
        } else {
          // Rating question
          if (!response.ratingValue) return false
        }
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!token || typeof token !== 'string' || !surveyData) return

    setState('submitting')

    try {
      const responseList = Object.values(responses).filter((r) => {
        // Only include responses that have actual values
        return r.ratingValue !== undefined || r.textValue !== undefined
      })

      const result = await ktiPublicService.submitResponses(token, responseList)

      if (result.error) {
        if (result.response?.status === 409) {
          setState('already_responded')
        } else if (result.response?.status === 400) {
          setState('ready')
          setError('Vennligst svar på alle obligatoriske spørsmål')
        } else {
          setState('error')
          setError('Kunne ikke sende inn svarene. Vennligst prøv igjen.')
        }
        return
      }

      setState('submitted')
    } catch {
      setState('error')
      setError('En feil oppstod ved innsending av svarene')
    }
  }

  // Group questions by category
  const groupedQuestions = surveyData?.questions.reduce(
    (acc, q) => {
      const category = q.category || 'Generelt'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(q)
      return acc
    },
    {} as Record<string, PublicSurveyQuestion[]>
  )

  const renderRatingScale = (question: PublicSurveyQuestion) => {
    const currentValue = responses[question.id]?.ratingValue
    const labels = ['Svært misfornøyd', '', '', '', '', 'Svært fornøyd']

    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>1 - {labels[0]}</span>
          <span>6 - {labels[5]}</span>
        </div>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRatingChange(question.id, value)}
              className={`w-12 h-12 rounded-lg text-lg font-medium transition-all
                ${
                  currentValue === value
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderTextInput = (question: PublicSurveyQuestion) => {
    const currentValue = responses[question.id]?.textValue || ''

    return (
      <textarea
        value={currentValue}
        onChange={(e) => handleTextChange(question.id, e.target.value)}
        rows={4}
        className="w-full mt-3 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="Skriv din kommentar her..."
      />
    )
  }

  // Loading state
  if (state === 'loading') {
    return (
      <SurveyLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laster undersøkelse...</p>
          </div>
        </div>
      </SurveyLayout>
    )
  }

  // Not found state
  if (state === 'not_found') {
    return (
      <SurveyLayout>
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Undersøkelsen ble ikke funnet
          </h1>
          <p className="text-gray-600">
            Lenken kan være utløpt eller ugyldig. Vennligst kontakt avsender hvis du mener dette er en feil.
          </p>
        </div>
      </SurveyLayout>
    )
  }

  // Error state
  if (state === 'error') {
    return (
      <SurveyLayout>
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-400"
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Noe gikk galt</h1>
          <p className="text-gray-600">{error || 'En uventet feil oppstod'}</p>
        </div>
      </SurveyLayout>
    )
  }

  // Already responded state
  if (state === 'already_responded') {
    return (
      <SurveyLayout>
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-green-500"
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Du har allerede svart</h1>
          <p className="text-gray-600">
            Takk for at du tok deg tid til å svare på denne undersøkelsen.
            {surveyData && (
              <>
                <br />
                Din tilbakemelding om {surveyData.consultantName} er registrert.
              </>
            )}
          </p>
        </div>
      </SurveyLayout>
    )
  }

  // Submitted state (thank you page)
  if (state === 'submitted') {
    return (
      <SurveyLayout>
        <div className="text-center py-16">
          <svg
            className="w-20 h-20 mx-auto mb-6 text-green-500"
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
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Takk for din tilbakemelding!</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Din vurdering av {surveyData?.consultantName} fra {surveyData?.organizationName} er nå registrert.
          </p>
          <p className="text-gray-500 mt-4">Du kan nå lukke denne siden.</p>
        </div>
      </SurveyLayout>
    )
  }

  // Ready state - show the form
  return (
    <SurveyLayout>
      <Head>
        <title>Kundetilfredshetsundersøkelse - JPro</title>
      </Head>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Kundetilfredshetsundersøkelse
        </h1>
        <p className="text-gray-600">
          {surveyData?.surveyName} ({surveyData?.year})
        </p>
      </div>

      {/* Consultant info */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8 text-center">
        <p className="text-gray-600 mb-1">Din tilbakemelding om</p>
        <p className="text-xl font-semibold text-blue-800">{surveyData?.consultantName}</p>
        <p className="text-gray-500 text-sm mt-1">fra {surveyData?.organizationName}</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm text-gray-600">
        <p>
          Vennligst vurder konsulentens arbeid på en skala fra 1 til 6, der 1 er svært misfornøyd og 6
          er svært fornøyd. Spørsmål merket med <span className="text-red-500">*</span> er
          obligatoriske.
        </p>
      </div>

      {/* Questions by category */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        {groupedQuestions &&
          Object.entries(groupedQuestions).map(([category, questions]) => (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                {translateCategory(category)}
              </h2>
              <div className="space-y-6">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <label className="block text-gray-800 font-medium mb-2">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {question.questionType === 'FREE_TEXT'
                      ? renderTextInput(question)
                      : renderRatingScale(question)}
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* Submit button */}
        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            disabled={state === 'submitting' || !isFormValid()}
            className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all
              ${
                isFormValid()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {state === 'submitting' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sender inn...
              </span>
            ) : (
              'Send inn svar'
            )}
          </button>
        </div>
      </form>
    </SurveyLayout>
  )
}

// Minimal layout for the survey page
function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Kundetilfredshetsundersøkelse - JPro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Simple header with JPro logo */}
        <header className="bg-[#1a1a2e] shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <Image
                src="/images/jpro-logo.svg"
                alt="JPro"
                width={100}
                height={68}
                priority
              />
              <span className="text-gray-300">|</span>
              <span className="text-white">Kundetilfredshetsundersøkelse</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>

        {/* Simple footer */}
        <footer className="bg-gray-50 border-t mt-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            <p>JPro Consulting AS</p>
            <p className="mt-1">Dine svar behandles konfidensielt</p>
          </div>
        </footer>
      </div>
    </>
  )
}
