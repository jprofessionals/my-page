'use client'

import { useState, useRef } from 'react'

interface ColorTheme {
  id: number
  name: string
  headerBgColor: string
  primaryColor: string
  accentBgColor: string
  isDefault?: boolean
}

interface PreviewToolbarProps {
  colorThemes: ColorTheme[]
  selectedThemeId?: number
  logoUrl?: string | null
  showThankYouPage: boolean
  saving: boolean
  disabled: boolean
  onThemeChange: (themeId: number) => void
  onLogoUpload: (file: File) => Promise<void>
  onLogoDelete: () => void
  onShowThankYouPageChange: (show: boolean) => void
  onCreateTheme: () => void
}

export default function PreviewToolbar({
  colorThemes,
  selectedThemeId,
  logoUrl,
  showThankYouPage,
  saving,
  disabled,
  onThemeChange,
  onLogoUpload,
  onLogoDelete,
  onShowThankYouPageChange,
  onCreateTheme,
}: PreviewToolbarProps) {
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedTheme = colorThemes.find((t) => t.id === selectedThemeId)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Ugyldig filtype. Tillatte typer: PNG, JPG, SVG, WebP')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('Filen er for stor. Maksimal størrelse er 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      await onLogoUpload(file)
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="bg-gray-50 border-b px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left side: Theme and Logo */}
        <div className="flex items-center gap-4">
          {/* Theme selector */}
          <div className="relative">
            <button
              onClick={() => !disabled && setShowThemeDropdown(!showThemeDropdown)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                disabled
                  ? 'bg-gray-100 cursor-not-allowed opacity-60'
                  : 'bg-white hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {/* Color swatches preview */}
              {selectedTheme ? (
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: selectedTheme.headerBgColor }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: selectedTheme.primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: selectedTheme.accentBgColor }}
                  />
                </div>
              ) : (
                <span className="text-gray-400">Velg tema</span>
              )}
              <span className="text-sm text-gray-700">
                {selectedTheme?.name || 'Fargetema'}
              </span>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Theme dropdown */}
            {showThemeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowThemeDropdown(false)}
                />
                <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-20 min-w-[200px]">
                  {colorThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onThemeChange(theme.id)
                        setShowThemeDropdown(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        selectedThemeId === theme.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: theme.headerBgColor }}
                        />
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: theme.accentBgColor }}
                        />
                      </div>
                      <span className="text-sm flex-1 text-left">{theme.name}</span>
                      {selectedThemeId === theme.id && (
                        <svg
                          className="w-4 h-4 text-orange-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="border-t">
                    <button
                      onClick={() => {
                        onCreateTheme()
                        setShowThemeDropdown(false)
                      }}
                      className="w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-b-lg text-left"
                    >
                      + Nytt tema
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logo upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              disabled={disabled || uploadingLogo}
              className="hidden"
              id="toolbar-logo-upload"
            />

            {logoUrl ? (
              <>
                <div className="relative w-10 h-6 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <label
                  htmlFor="toolbar-logo-upload"
                  className={`text-sm text-gray-600 hover:text-gray-900 cursor-pointer ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingLogo ? 'Laster...' : 'Endre'}
                </label>
                <button
                  onClick={onLogoDelete}
                  disabled={disabled}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Slett
                </button>
              </>
            ) : (
              <label
                htmlFor="toolbar-logo-upload"
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 ${
                  disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-gray-400 cursor-pointer'
                }`}
              >
                {uploadingLogo ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    <span>Laster...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Logo</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        {/* Right side: View toggle and save status */}
        <div className="flex items-center gap-4">
          {/* Thank you page toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600">Takk-side</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showThankYouPage}
                onChange={(e) => onShowThankYouPageChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </div>
          </label>

          {/* Save status */}
          {saving && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span>Lagrer...</span>
            </div>
          )}

          {/* Disabled indicator */}
          {disabled && (
            <div className="flex items-center gap-1 text-sm text-yellow-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Låst</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
