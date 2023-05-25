import ApiService from '../../services/api.service'
import { useState } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import * as Dialog from '../ui/dialog'
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
    <Dialog.Dialog>
      <Dialog.Trigger asChild>
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
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="mb-6 prose">
          <h2>Slett post</h2>
          <p>
            Er du sikker på at du vil slette{' '}
            <span className="text-xl">&ldquo;{post.description}&rdquo;</span>?
          </p>
        </div>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="error" onClick={handleDeletePost} size="sm">
              Slett post
            </Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button size="sm">Avbryt</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Dialog>
  )
}

export default DeleteBudgetPostModal
