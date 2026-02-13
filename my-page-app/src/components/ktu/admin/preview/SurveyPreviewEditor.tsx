'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import ktuService, {
  KtuRound,
  KtuColorTheme,
  KtuRoundQuestion,
  UpdateKtuRound,
  CreateKtuColorTheme,
} from '@/services/ktu.service'
import PreviewToolbar from './PreviewToolbar'
import SurveyPreviewHeader from './SurveyPreviewHeader'
import SurveyPreviewBody from './SurveyPreviewBody'
import SurveyThankYouPreview from './SurveyThankYouPreview'

interface Props {
  survey: KtuRound
  questions: KtuRoundQuestion[]
  onUpdate: () => void
}

// Debounce delay for auto-save (ms)
const AUTOSAVE_DELAY = 1500

export default function SurveyPreviewEditor({
  survey,
  questions,
  onUpdate,
}: Props) {
  // Color themes
  const [colorThemes, setColorThemes] = useState<KtuColorTheme[]>([])
  const [loadingThemes, setLoadingThemes] = useState(true)

  // Local state for all editable fields
  const [selectedThemeId, setSelectedThemeId] = useState<number | undefined>(
    survey.colorTheme?.id,
  )
  const [logoUrl, setLogoUrl] = useState<string | null>(survey.logoUrl || null)
  const [introText, setIntroText] = useState(survey.introText || '')
  const [instructionText, setInstructionText] = useState(
    survey.instructionText || '',
  )
  const [ratingLabelLow, setRatingLabelLow] = useState(
    survey.ratingLabelLow || '',
  )
  const [ratingLabelHigh, setRatingLabelHigh] = useState(
    survey.ratingLabelHigh || '',
  )
  const [thankYouTitle, setThankYouTitle] = useState(survey.thankYouTitle || '')
  const [thankYouMessage, setThankYouMessage] = useState(
    survey.thankYouMessage || '',
  )
  const [commentFieldLabel, setCommentFieldLabel] = useState(
    survey.commentFieldLabel || '',
  )

  // UI state
  const [showThankYouPage, setShowThankYouPage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreateThemeModal, setShowCreateThemeModal] = useState(false)
  const [creatingTheme, setCreatingTheme] = useState(false)
  const [newTheme, setNewTheme] = useState<CreateKtuColorTheme>({
    name: '',
    headerBgColor: '#ffffff',
    primaryColor: '#f97316',
    accentBgColor: '#fff7ed',
    isDefault: false,
  })

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isDraft = survey.status === 'DRAFT'

  // Get current theme colors
  const selectedTheme = colorThemes.find((t) => t.id === selectedThemeId)
  const headerBgColor = selectedTheme?.headerBgColor || '#ffffff'
  const primaryColor = selectedTheme?.primaryColor || '#f97316'
  const accentBgColor = selectedTheme?.accentBgColor || '#fff7ed'

  // Load color themes on mount
  useEffect(() => {
    loadColorThemes()
  }, [])

  // Reset local state when survey changes
  useEffect(() => {
    setSelectedThemeId(survey.colorTheme?.id)
    setLogoUrl(survey.logoUrl || null)
    setIntroText(survey.introText || '')
    setInstructionText(survey.instructionText || '')
    setRatingLabelLow(survey.ratingLabelLow || '')
    setRatingLabelHigh(survey.ratingLabelHigh || '')
    setThankYouTitle(survey.thankYouTitle || '')
    setThankYouMessage(survey.thankYouMessage || '')
    setCommentFieldLabel(survey.commentFieldLabel || '')
  }, [survey])

  const loadColorThemes = async () => {
    try {
      const response = await ktuService.getColorThemes()
      setColorThemes(response.data || [])
    } catch (error) {
      console.error('Failed to load color themes:', error)
      toast.error('Feil ved lasting av fargetemaer')
    } finally {
      setLoadingThemes(false)
    }
  }

  // Auto-save function
  const saveChanges = useCallback(
    async (updates: UpdateKtuRound) => {
      if (!isDraft) return

      setSaving(true)
      try {
        await ktuService.updateRound(survey.id, updates)
        onUpdate()
      } catch (error) {
        console.error('Failed to save:', error)
        toast.error('Feil ved lagring')
      } finally {
        setSaving(false)
      }
    },
    [survey.id, isDraft, onUpdate],
  )

  // Debounced save for text fields
  const debouncedSave = useCallback(
    (updates: UpdateKtuRound) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveChanges(updates)
      }, AUTOSAVE_DELAY)
    },
    [saveChanges],
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Handler functions that update local state and trigger auto-save
  const handleThemeChange = (themeId: number) => {
    setSelectedThemeId(themeId)
    saveChanges({ colorThemeId: themeId })
  }

  const handleIntroTextChange = (value: string) => {
    setIntroText(value)
    debouncedSave({ introText: value || undefined })
  }

  const handleInstructionTextChange = (value: string) => {
    setInstructionText(value)
    debouncedSave({ instructionText: value || undefined })
  }

  const handleRatingLabelLowChange = (value: string) => {
    setRatingLabelLow(value)
    debouncedSave({ ratingLabelLow: value || undefined })
  }

  const handleRatingLabelHighChange = (value: string) => {
    setRatingLabelHigh(value)
    debouncedSave({ ratingLabelHigh: value || undefined })
  }

  const handleThankYouTitleChange = (value: string) => {
    setThankYouTitle(value)
    debouncedSave({ thankYouTitle: value || undefined })
  }

  const handleThankYouMessageChange = (value: string) => {
    setThankYouMessage(value)
    debouncedSave({ thankYouMessage: value || undefined })
  }

  // Per-question text change handler
  const handleQuestionTextChange = useCallback(
    async (questionId: number, value: string) => {
      if (!isDraft) return

      setSaving(true)
      try {
        await ktuService.updateRoundQuestion(survey.id, questionId, {
          customTextNo: value || undefined,
        })
        onUpdate()
      } catch (error) {
        console.error('Failed to update question text:', error)
        toast.error('Feil ved lagring av spørsmålstekst')
      } finally {
        setSaving(false)
      }
    },
    [survey.id, isDraft, onUpdate],
  )

  // Per-question comment field label change handler
  const handleQuestionCommentFieldLabelChange = useCallback(
    async (questionId: number, value: string) => {
      if (!isDraft) return

      setSaving(true)
      try {
        await ktuService.updateRoundQuestion(survey.id, questionId, {
          commentFieldLabel: value || undefined,
        })
        onUpdate()
      } catch (error) {
        console.error('Failed to update question comment label:', error)
        toast.error('Feil ved lagring av kommentarfelt-label')
      } finally {
        setSaving(false)
      }
    },
    [survey.id, isDraft, onUpdate],
  )

  // Per-question required override handler
  const handleQuestionRequiredChange = useCallback(
    async (questionId: number, value: boolean) => {
      if (!isDraft) return

      setSaving(true)
      try {
        await ktuService.updateRoundQuestion(survey.id, questionId, {
          requiredOverride: value,
        })
        onUpdate()
      } catch (error) {
        console.error('Failed to update question required:', error)
        toast.error('Feil ved lagring av obligatorisk-status')
      } finally {
        setSaving(false)
      }
    },
    [survey.id, isDraft, onUpdate],
  )

  const handleLogoUpload = async (file: File) => {
    if (!isDraft) {
      toast.warning(
        'Logo kan kun lastes opp når undersøkelsen er i UTKAST-status',
      )
      return
    }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file)
    setLogoUrl(previewUrl)

    try {
      await ktuService.uploadLogo(survey.id, file)
      toast.success('Logo lastet opp')
      onUpdate()
    } catch (error) {
      console.error('Failed to upload logo:', error)
      toast.error('Feil ved opplasting av logo')
      // Revert preview on error
      setLogoUrl(survey.logoUrl || null)
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('Er du sikker på at du vil slette logoen?')) return

    if (!isDraft) {
      toast.warning('Logo kan kun slettes når undersøkelsen er i UTKAST-status')
      return
    }

    try {
      await ktuService.deleteLogo(survey.id)
      setLogoUrl(null)
      toast.success('Logo slettet')
      onUpdate()
    } catch (error) {
      console.error('Failed to delete logo:', error)
      toast.error('Feil ved sletting av logo')
    }
  }

  const handleQuestionsReorder = async (questionIds: number[]) => {
    // Update display order for questions
    try {
      for (let i = 0; i < questionIds.length; i++) {
        await ktuService.updateRoundQuestion(survey.id, questionIds[i], {
          displayOrder: i + 1,
        })
      }
      onUpdate()
    } catch (error) {
      console.error('Failed to reorder questions:', error)
      toast.error('Feil ved endring av rekkefølge')
    }
  }

  const handleCreateTheme = async () => {
    if (!newTheme.name.trim()) {
      toast.warning('Vennligst fyll inn navn på temaet')
      return
    }

    setCreatingTheme(true)
    try {
      await ktuService.createColorTheme(newTheme)
      toast.success('Fargetema opprettet')
      setShowCreateThemeModal(false)
      setNewTheme({
        name: '',
        headerBgColor: '#ffffff',
        primaryColor: '#f97316',
        accentBgColor: '#fff7ed',
        isDefault: false,
      })
      loadColorThemes()
    } catch (error) {
      console.error('Failed to create color theme:', error)
      toast.error('Feil ved opprettelse av fargetema')
    } finally {
      setCreatingTheme(false)
    }
  }

  if (loadingThemes) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Warning for non-draft surveys */}
      {!isDraft && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5"
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
          <div>
            <p className="font-medium text-yellow-800">
              Forhåndsvisning (kun lesing)
            </p>
            <p className="text-sm text-yellow-700">
              Undersøkelsen er ikke lenger i UTKAST-status. Utseendet kan ikke
              endres.
            </p>
          </div>
        </div>
      )}

      {/* Preview container */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
        {/* Toolbar */}
        <PreviewToolbar
          colorThemes={colorThemes}
          selectedThemeId={selectedThemeId}
          logoUrl={logoUrl}
          showThankYouPage={showThankYouPage}
          saving={saving}
          disabled={!isDraft}
          onThemeChange={handleThemeChange}
          onLogoUpload={handleLogoUpload}
          onLogoDelete={handleLogoDelete}
          onShowThankYouPageChange={setShowThankYouPage}
          onCreateTheme={() => setShowCreateThemeModal(true)}
        />

        {/* Preview area with gradient background */}
        <div className="bg-gradient-to-b from-blue-50 to-white">
          {/* Header */}
          <SurveyPreviewHeader
            logoUrl={logoUrl}
            headerBgColor={headerBgColor}
            surveyName={survey.name}
            year={survey.year}
          />

          {/* Body or Thank You page */}
          {showThankYouPage ? (
            <SurveyThankYouPreview
              thankYouTitle={thankYouTitle}
              thankYouMessage={thankYouMessage}
              primaryColor={primaryColor}
              onThankYouTitleChange={handleThankYouTitleChange}
              onThankYouMessageChange={handleThankYouMessageChange}
              disabled={!isDraft}
            />
          ) : (
            <SurveyPreviewBody
              surveyName={survey.name}
              year={survey.year}
              questions={questions}
              introText={introText}
              instructionText={instructionText}
              ratingLabelLow={ratingLabelLow}
              ratingLabelHigh={ratingLabelHigh}
              defaultCommentFieldLabel={commentFieldLabel}
              primaryColor={primaryColor}
              accentBgColor={accentBgColor}
              onIntroTextChange={handleIntroTextChange}
              onInstructionTextChange={handleInstructionTextChange}
              onRatingLabelLowChange={handleRatingLabelLowChange}
              onRatingLabelHighChange={handleRatingLabelHighChange}
              onQuestionTextChange={handleQuestionTextChange}
              onRequiredChange={handleQuestionRequiredChange}
              onCommentFieldLabelChange={handleQuestionCommentFieldLabelChange}
              onQuestionsReorder={handleQuestionsReorder}
              disabled={!isDraft}
            />
          )}
        </div>
      </div>

      {/* Create Theme Modal */}
      {showCreateThemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Nytt fargetema</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn *
                </label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={(e) =>
                    setNewTheme({ ...newTheme, name: e.target.value })
                  }
                  placeholder="f.eks. JPro Blå"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTheme.headerBgColor}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          headerBgColor: e.target.value,
                        })
                      }
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newTheme.headerBgColor}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          headerBgColor: e.target.value,
                        })
                      }
                      className="flex-1 px-2 py-1 border rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTheme.primaryColor}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newTheme.primaryColor}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 px-2 py-1 border rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTheme.accentBgColor}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          accentBgColor: e.target.value,
                        })
                      }
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newTheme.accentBgColor}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          accentBgColor: e.target.value,
                        })
                      }
                      className="flex-1 px-2 py-1 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Forhåndsvisning:</p>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-12 rounded flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: newTheme.headerBgColor }}
                  >
                    Header
                  </div>
                  <div
                    className="w-24 h-12 rounded flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: newTheme.primaryColor }}
                  >
                    Knapp
                  </div>
                  <div
                    className="w-24 h-12 rounded border flex items-center justify-center text-sm"
                    style={{ backgroundColor: newTheme.accentBgColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateThemeModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateTheme}
                disabled={creatingTheme || !newTheme.name.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {creatingTheme ? 'Oppretter...' : 'Opprett tema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
