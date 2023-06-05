import ApiService from '../../services/api.service'
import { useState } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import * as Modal from '../ui/modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'
import { Button } from '../ui/button'
type Props = {
  refreshBudgets: Function
  post: any
}

const DeleteBudgetPostModal = ({ refreshBudgets, post }: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const handleDeletePost = (e: any) => {
    setIsLoading(true)
    e.preventDefault()
    ApiService.deleteBudgetPost(post.id).then(
      () => {
        refreshBudgets()
        setIsLoading(false)
        toast.success('Slettet ' + post.description)
      },
      () => {
        setIsLoading(false)
        toast.error('Får ikke slettet posten, prøv igjen senere')
      },
    )
  }
  return (
    <Modal.Modal>
      <Modal.Trigger asChild>
        <Button
          className="text-white btn btn-error btn-sm"
          type="button"
          title="Slett post"
          disabled={post.locked}
        >
          {isLoading ? (
            <FontAwesomeIcon
              icon={faRefresh}
              className="animate-spin"
              size="sm"
            />
          ) : (
            'Slett'
          )}
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <div className="mb-6 prose">
          <h2>Slett post</h2>
          <p>
            Er du sikker på at du vil slette{' '}
            <span className="text-xl">&ldquo;{post.description}&rdquo;</span>?
          </p>
        </div>
        <Modal.Footer>
          <Modal.Close asChild>
            <Button variant="error" onClick={handleDeletePost} size="sm">
              Slett post
            </Button>
          </Modal.Close>
          <Modal.Close asChild>
            <Button size="sm">Avbryt</Button>
          </Modal.Close>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Modal>
  )
}

export default DeleteBudgetPostModal
