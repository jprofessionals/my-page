'use client'

import { Autocomplete, TextField } from '@mui/material'
import { Customer } from '@/data/types'
import { useJobPostingCustomers } from '@/hooks/jobPosting'

type PropsType = {
  customer: Customer | null
  setCustomer(customer: Customer | null): void
}

export default function CustomerFilter({ customer, setCustomer }: PropsType) {
  const { data: customerOptions } = useJobPostingCustomers()

  if (!customerOptions) {
    return
  }

  return (
    <Autocomplete
      options={customerOptions}
      getOptionLabel={(option) => option.name}
      value={customer}
      onChange={(event, newValue: Customer | null) => {
        setCustomer(newValue)
      }}
      disablePortal
      renderInput={(params) => (
        <TextField {...params} label="Kunde" variant="outlined" />
      )}
    />
  )
}
