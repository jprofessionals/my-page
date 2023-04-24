import React, { useState } from 'react'
import ApiService, { API_URL } from '../../services/api.service'
import Moment from 'moment'
import { Button, Card } from 'react-bootstrap'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Budget, Post } from '@/types'
import Loading from '@/components/Loading'
import { useMutation } from "react-query";
import axios from "axios";
import authHeader from "@/services/auth-header";

type Props = {
  budget: Budget
  refreshBudgets: Function
  toggle: Function
}

type CreatePostVariables = {
  post: Post
  budgetId: string
}

const postBudgetPost = async ({post, budgetId}: CreatePostVariables): Promise<Post> => {
  const response = await axios.post(API_URL + 'budget/' + budgetId + '/posts', post, {
    headers: authHeader(),
  })
  return response.data
}

const CreateBudgetPost = ({ budget, refreshBudgets, toggle }: Props) => {
  const [description, setDescription] = useState('')
  const [amountExMva, setAmountExMva] = useState(0)
  const [date, setDate] = useState(Moment().format('YYYY-MM-DD'))
  const [isLoadingPost, setIsLoadingPost] = useState(false)

  const { mutate: createBudgetPost, isLoading } = useMutation(postBudgetPost, {
    onSuccess: () => {
      refreshBudgets()
      toggle()
      toast.success('Lagret ' + description)
    },
    onError: () => {
      toast.error('Fikk ikke opprettet ' + description + ', prøv igjen')
    }
  })
  const isValid = amountExMva > 0 && description && description !== ''

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      const budgetPost: Post = {
        date: date,
        description: description,
        amountExMva: amountExMva,
        expense: true,
      }
      createBudgetPost({post: budgetPost, budgetId: budget.id})
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
