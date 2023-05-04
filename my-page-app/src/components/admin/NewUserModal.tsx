import { FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import NewEmployeeForm from '@/components/newemployee/NewEmployeeForm'
import { NewEmployee } from '@/types'
import { useMutation } from 'react-query'
import axios, { AxiosError } from 'axios'
import { API_URL } from '@/services/api.service'
import authHeader from '@/services/auth-header'
import { Alert } from 'react-bootstrap'
import { toast } from 'react-toastify'

const createNewEmployee = async (newEmployee: NewEmployee) => {
  const modifiedNewEmployee = {
    ...newEmployee,
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
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputData, setInputData] = useState<NewEmployee>(initialInputData)

  const { mutate } = useMutation(createNewEmployee, {
    onSuccess: () => {
      toast.info('Opprettet bruker')
      resetInputData()
      setShow(false)
      setError(null)
    },
    onError: (error: AxiosError) => {
      toast.error(`Klarte ikke opprette ny bruker: ${error.message}`)
    },
  })

  const handleClose = () => {
    resetInputData()
    setShow(false)
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

  const handleShow = () => setShow(true)

  const resetInputData = () => {
    setInputData(initialInputData)
  }

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        Legg til ny ansatt
      </Button>

      <Modal show={show} onHide={handleClose} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Legg til ny ansatt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <NewEmployeeForm inputData={inputData} setInputData={setInputData} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Lukk
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Lagre
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
