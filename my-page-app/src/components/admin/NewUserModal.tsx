import React, { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import NewEmployeeForm from '@/components/newemployee/NewEmployeeForm'
import { NewEmployeeDTO } from '@/types'
import { useMutation } from 'react-query'
import axios from 'axios'
import { API_URL } from '@/services/api.service'
import authHeader from '@/services/auth-header'

const createNewEmployee = async (newEmployeeDTO: NewEmployeeDTO) => {
  return await axios.post(
    API_URL + 'user',
    newEmployeeDTO,
    {
      headers: authHeader(),
    },
  )
}

export default function NewUserModal() {
  const [show, setShow] = useState(false)
  const [inputData, setInputData] = useState<NewEmployeeDTO>({
    email: '',
    employeeNumber: 0,
    budgetStartDate: '',
  })

  const { mutate } = useMutation(
    createNewEmployee,
    {
      onSuccess: () => {
        resetInputData()
        setShow(false)
      },
    },
  )

  const handleClose = () => {
    resetInputData()
    setShow(false)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    mutate(inputData)
  }

  const handleShow = () => setShow(true)

  const resetInputData = () => {
    setInputData({
      email: '',
      employeeNumber: 0,
      budgetStartDate: '',
    })
  }

  return (
    <>
      <Button variant='primary' onClick={handleShow}>
        Legg til ny ansatt
      </Button>

      <Modal show={show} onHide={handleClose} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Legg til ny ansatt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <NewEmployeeForm inputData={inputData} setInputData={setInputData} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Lukk
          </Button>
          <Button variant='primary' onClick={handleSubmit}>
            Lagre
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

