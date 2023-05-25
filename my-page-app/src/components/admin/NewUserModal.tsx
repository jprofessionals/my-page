import { FormEvent, useState } from 'react'
import NewEmployeeForm from '@/components/newemployee/NewEmployeeForm'
import { NewEmployee } from '@/types'
import { useMutation } from 'react-query'
import axios, { AxiosError } from 'axios'
import { API_URL } from '@/services/api.service'
import authHeader from '@/services/auth-header'
import { toast } from 'react-toastify'
import { Button } from '../ui/button'
import * as Dialog from '../ui/dialog'
import { Alert } from '../ui/alert'

// @jpro.no in the form is now optional, indicated by a new label on the input.
// Add the @jpro.no if no @ is provided, otherwise let it through like normal
const parseEmail = (email?: string) => {
  if (email?.includes('@')) {
    return email
  }
  // If no manual @ is added, append @jpro.no to value
  return `${email}@jpro.no`
}

const createNewEmployee = async (newEmployee: NewEmployee) => {
  const modifiedNewEmployee = {
    ...newEmployee,
    email: parseEmail(newEmployee.email),
    employeeNumber: parseInt(newEmployee.employeeNumber, 10),
  }

  return await axios.post(API_URL + 'user', modifiedNewEmployee, {
    headers: authHeader(),
  })
}

const initialInputData: NewEmployee = {
  email: '',
  employeeNumber: '',
  budgetStartDate: '',
}

export default function NewUserModal() {
  const [error, setError] = useState<string | null>(null)
  const [inputData, setInputData] = useState<NewEmployee>(initialInputData)

  const { mutate } = useMutation(createNewEmployee, {
    onSuccess: () => {
      toast.info('Opprettet bruker')
      resetInputData()
      setError(null)
    },
    onError: (error: AxiosError) => {
      toast.error(`Klarte ikke opprette ny bruker: ${error.response?.data}`)
    },
  })

  const handleClose = () => {
    resetInputData()
    setError(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (
      inputData.email &&
      inputData.employeeNumber &&
      inputData.budgetStartDate
    ) {
      setError(null)
      mutate(inputData)
    } else {
      setError('Du må fylle ut alle feltene.')
    }
  }

  const resetInputData = () => {
    setInputData(initialInputData)
  }

  return (
    <Dialog.Dialog>
      <Dialog.Trigger asChild>
        <Button variant="outline">Legg til ny ansatt</Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Legg til ny ansatt</Dialog.Title>
        </Dialog.Header>
        <div>
          {error && <Alert variant="error">{error}</Alert>}
          <NewEmployeeForm inputData={inputData} setInputData={setInputData} />
        </div>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button onClick={handleClose}>Lukk</Button>
          </Dialog.Close>

          <Dialog.Close asChild>
            <Button onClick={handleSubmit} variant="primary">
              Lagre
            </Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Dialog>
  )
}
