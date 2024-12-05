'use client'

import {
  Autocomplete,
  Chip,
  createFilterOptions,
  TextField,
} from '@mui/material'
import { Tag, Tags } from '@/data/types'
import { useJobPostingTags } from '@/hooks/jobPosting'
import { useState } from 'react'

type PropsType = {
  tags: Tags
  setTags(tags: Tags): void
}

export default function TagFilter({ tags, setTags }: PropsType) {
  const [tagInputValue, setTagInputValue] = useState('')
  const { data: tagOptions } = useJobPostingTags()

  if (!tagOptions) {
    return
  }

  return (
    <Autocomplete
      multiple
      options={tagOptions}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option
        }
        return option.name
      }}
      inputValue={tagInputValue}
      filterOptions={(options, params) => {
        const { inputValue } = params
        const filteredOptions = options.filter((option) => {
          const optionName = typeof option === 'string' ? option : option.name
          return !tags.some((tag) => tag.name === optionName)
        })

        const filter = createFilterOptions<Tag>()
        const filtered = filter(filteredOptions, params)

        const isExistingOption = options.some((option) => {
          const optionName = typeof option === 'string' ? option : option.name
          return optionName.toLowerCase() === inputValue.toLowerCase()
        })
        const isExistingTag = tags.some(
          (tag) => tag.name.toLowerCase() === inputValue.toLowerCase(),
        )

        if (inputValue !== '' && !isExistingOption && !isExistingTag) {
          filtered.push({ id: 0, name: inputValue })
        }

        return filtered
      }}
      freeSolo
      value={tags}
      onChange={(event, newValue) => {
        const updatedTags = newValue.map((item) => {
          if (typeof item === 'string') {
            return { id: 0, name: item }
          }
          return item
        })
        const uniqueTags = updatedTags.filter(
          (tag, index, self) =>
            index === self.findIndex((t) => t.name === tag.name),
        )
        setTags(uniqueTags)
        setTagInputValue('')
      }}
      onInputChange={(event, newInputValue, reason) => {
        if (reason === 'input') {
          setTagInputValue(newInputValue)
        }
      }}
      disablePortal
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index })
          return <Chip key={key} label={option.name} {...tagProps} />
        })
      }
      renderInput={(params) => (
        <TextField {...params} label="Emneknagger" variant="outlined" />
      )}
    />
  )
}
