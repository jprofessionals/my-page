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
      onInputChange={(event, newInputValue, reason) => {
        if (reason === 'input') {
          const matchingCustomer = customerOptions.find(
            (elem) => elem.name === newInputValue,
          )

          if (!matchingCustomer) {
            const newCustomer: Customer = {
              id: 0,
              name: newInputValue,
            }

            setCustomer(newCustomer)
          }
        }
      }}
      disablePortal
      renderInput={(params) => (
        <TextField {...params} label="Kunde" variant="outlined" required />
      )}
    />
  )
}
