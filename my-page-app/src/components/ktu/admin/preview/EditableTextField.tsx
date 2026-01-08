'use client'

import { useState, useRef, useEffect } from 'react'

interface EditableTextFieldProps {
  value: string
  defaultValue?: string
  placeholder?: string
  onChange: (value: string) => void
  disabled?: boolean
  multiline?: boolean
  className?: string
  textClassName?: string
}

export default function EditableTextField({
  value,
  defaultValue = '',
  placeholder = 'Klikk for å redigere',
  onChange,
  disabled = false,
  multiline = false,
  className = '',
  textClassName = '',
}: EditableTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing) {
      const ref = multiline ? textareaRef.current : inputRef.current
      if (ref) {
        ref.focus()
        ref.select()
      }
    }
  }, [isEditing, multiline])

  const handleClick = () => {
    if (!disabled) {
      // Pre-fill with displayed value (including default) when starting to edit
      const displayedValue = value || defaultValue
      setLocalValue(displayedValue)
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setLocalValue(value)
      setIsEditing(false)
    }
  }

  const displayValue = localValue || defaultValue
  const isEmpty = !localValue

  if (isEditing) {
    const baseClassName = `w-full px-2 py-1 border-2 border-orange-400 rounded focus:outline-none focus:border-orange-500 ${className}`

    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={baseClassName}
          rows={3}
        />
      )
    }

    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={baseClassName}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative ${disabled ? 'cursor-default' : 'cursor-pointer'} ${className}`}
    >
      <span
        className={`
          ${textClassName}
          ${isEmpty ? 'text-gray-400 italic' : ''}
          ${!disabled ? 'group-hover:bg-orange-50 group-hover:border-orange-200' : ''}
          inline-block px-2 py-1 rounded border border-transparent transition-all
        `}
      >
        {displayValue}
        {isEmpty && !disabled && (
          <span className="text-gray-400 text-sm ml-1">(klikk for å redigere)</span>
        )}
      </span>
      {!disabled && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </span>
      )}
    </div>
  )
}
