import { FormEvent, useState } from 'react'
import NewEmployeeForm from '@/components/newemployee/NewEmployeeForm'
import { useMutation } from '@tanstack/react-query'
import { createUser } from '@/data/types/sdk.gen'
import { type NewEmployee, type UserReadable } from '@/data/types/types.gen'
import '@/services/openapi-client'
import { toast } from 'react-toastify'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import * as Modal from '../ui/modal'

// Form state type - uses strings for all fields (as they come from inputs)
type NewEmployeeFormData = {
  email: string
  employeeNumber: string
  budgetStartDate: string
}

// @jpro.no in the form is now optional, indicated by a new label on the input.
// Add the @jpro.no if no @ is provided, otherwise let it through like normal
const parseEmail = (email?: string) => {
  if (email?.includes('@')) {
    return email
  }
  // If no manual @ is added, append @jpro.no to value
  return `${email}@jpro.no`
}

const createNewEmployee = async (formData: NewEmployeeFormData): Promise<{ data: UserReadable }> => {
  const newEmployee: NewEmployee = {
    email: parseEmail(formData.email),
    employeeNumber: parseInt(formData.employeeNumber, 10),
    budgetStartDate: formData.budgetStartDate,
  }

  const { data, error } = await createUser({
    body: newEmployee,
  })

  if (error || !data) {
    throw new Error(error ? String(error) : 'Failed to create user')
  }

  return { data }
}

const initialInputData: NewEmployeeFormData = {
  email: '',
  employeeNumber: '',
  budgetStartDate: '',
}

export default function NewUserModal() {
  const [error, setError] = useState<string | null>(null)
  const [inputData, setInputData] = useState<NewEmployeeFormData>(initialInputData)

  const { mutate } = useMutation({
    mutationFn: createNewEmployee,

    onSuccess: () => {
      toast.info('Opprettet bruker')
      resetInputData()
      setError(null)
    },

    onError: (error: Error) => {
      toast.error(`Klarte ikke opprette ny bruker: ${error.message}`)
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
    <Modal.Dialog>
      <Modal.DialogTrigger asChild>
        <Button variant="outline" title="Oppretter budsjetter for ny ansatt">Legg til ny ansatt</Button>
      </Modal.DialogTrigger>

      <Modal.DialogContent className="bg-white">
        <Modal.DialogHeader>
          <Modal.DialogTitle>Legg til ny ansatt</Modal.DialogTitle>
          <Modal.DialogDescription>Oppretter budsjetter for nyansatt. Fungerer både om det gjøres før ansatt har logget inn første gang og etter. Ansattnummer hentes fra Tripletex. Oppstart for budsjetter er vanligvis samme som stardato for den ansatte.</Modal.DialogDescription>
        </Modal.DialogHeader>
        {error && <Alert variant="error">{error}</Alert>}
        <NewEmployeeForm inputData={inputData} setInputData={setInputData} />
        <Modal.DialogFooter>
          <Modal.DialogClose asChild>
            <Button onClick={handleClose}>Lukk</Button>
          </Modal.DialogClose>

          <Modal.DialogClose asChild>
            <Button onClick={handleSubmit} variant="primary">
              Lagre
            </Button>
          </Modal.DialogClose>
        </Modal.DialogFooter>
      </Modal.DialogContent>
    </Modal.Dialog>
  )
}
