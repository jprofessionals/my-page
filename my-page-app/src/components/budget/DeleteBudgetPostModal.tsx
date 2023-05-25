import ApiService from '../../services/api.service'
import { useState } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
type Props = {
  isDeleteModalOpen: boolean
  toggler: Function
  refreshBudgets: Function
  post: any
  setIsLoadingDeletePost: Function
}

const DeleteBudgetPostModal = ({
  isDeleteModalOpen,
  toggler,
  refreshBudgets,
  post,
  setIsLoadingDeletePost,
}: Props) => {
  const handleDeletePost = (e: any) => {
    setIsLoadingDeletePost(true)
    e.preventDefault()
    ApiService.deleteBudgetPost(post.id).then(
      (response) => {
        refreshBudgets()
        setIsLoadingDeletePost(false)
        toast.success('Slettet ' + post.description)
      },
      (error) => {
        setIsLoadingDeletePost(false)
        toast.error('Får ikke slettet posten, prøv igjen senere')
      },
    )
  }
  return (
    <div>
      <Modal
        show={isDeleteModalOpen}
        className="modal d-flex align-items-center"
        backdrop="static"
      >
        <div className="modal-body">
          <div className="container ">
            <h1>Slett post</h1>
            <p>Er du sikker på at du vil slette {post.description}?</p>
            <div className="modalBtns">
              <button
                type="button"
                className="deletebtn btn"
                onClick={handleDeletePost}
              >
                Slett post
              </button>
              <button
                type="button"
                className="cancelbtn btn"
                onClick={() => toggler()}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DeleteBudgetPostModal
