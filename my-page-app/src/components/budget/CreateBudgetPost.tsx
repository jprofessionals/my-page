import React, { useState } from 'react'
import ApiService from '../../services/api.service'
import Moment from 'moment'
import { Card, Button, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Budget } from '@/types'
import Loading from '@/components/Loading'

type Props = {
  budget: Budget
  refreshBudgets: Function
  toggle: Function
}

const CreateBudgetPost = ({ budget, refreshBudgets, toggle }: Props) => {
  const [description, setDescription] = useState('')
  const [amountExMva, setAmountExMva] = useState(0)
  const [date, setDate] = useState(Moment().format('YYYY-MM-DD'))
  const [isLoadingPost, setIsLoadingPost] = useState(false)

  const isValid = amountExMva > 0 && description && description !== ''

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      setIsLoadingPost(true)
      const budgetPost = {
        date: date,
        description: description,
        amountExMva: amountExMva,
        expense: true,
      }
      ApiService.createBudgetPost(budgetPost, budget.id).then(
        (response) => {
          refreshBudgets()
          toggle()
          setIsLoadingPost(false)
          toast.success('Lagret ' + description)
        },
        (error) => {
          setIsLoadingPost(false)
          toast.error('Fikk ikke opprettet ' + description + ', prøv igjen')
        },
      )
    }
  }

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value)
  }

  const handleAmountChange = (e: any) => {
    setAmountExMva(e.target.value)
  }

  const handleDateChange = (e: any) => {
    setDate(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="inputCard">
        <Card.Header>
          <input
            className="description"
            type="text"
            name="description"
            placeholder="Beskrivelse"
            onChange={handleDescriptionChange}
            value={description}
            required
          />
        </Card.Header>
        <Card.Body>
          <ul className="addPost">
            <li>
              <span className="priceTitle">Pris:</span>
              <input
                type="number"
                name="amountExMva"
                placeholder="Pris inkludert mva"
                onChange={handleAmountChange}
                value={amountExMva}
                required
              />
            </li>
            <li>
              <span className="datoTitle">Dato:</span>
              <input
                className="inputDate"
                type="date"
                name="date"
                onChange={handleDateChange}
                value={date}
                // format="DD.MM.YYYY"
              ></input>
            </li>
          </ul>
          {isValid ? (
            <Button
              className="addPostBtn"
              type="submit"
              style={isValid ? {} : { display: 'none' }}
            >
              <div className="d-flex align-items-center">
                Legg til utlegget
                <Loading isLoading={isLoadingPost} />
              </div>
            </Button>
          ) : null}
        </Card.Body>
      </Card>
    </form>
  )
}

export default CreateBudgetPost
