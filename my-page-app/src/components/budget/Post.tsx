import { useState } from 'react'
import { Card, Button, Spinner } from 'react-bootstrap'
import Moment from 'moment'
import DeleteBudgetPostModal from './DeleteBudgetPostModal'
import EditBudgetPost from './EditBudgetPost'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faEdit } from '@fortawesome/free-solid-svg-icons'
import { Budget } from '@/types'
import styles from './Post.module.scss'
import getInNok from '@/utils/getInNok'
import clsx from 'clsx'

type Props = {
  budget: Budget
  refreshBudgets: Function
  post: any
}
const Post = ({ refreshBudgets, post, budget }: Props) => {
  const [isLoadingEditPost, setIsLoadingEditPost] = useState(false)
  const [isLoadingDeletePost, setIsLoadingDeletePost] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditPostOpen, setIsEditPostOpen] = useState(false)

  const postInFuture = () => {
    return post.date > Moment().format('YYYY-MM-DD')
  }

  const toggler = () => {
    if (isDeleteModalOpen) {
      setIsDeleteModalOpen(false)
    } else {
      setIsDeleteModalOpen(true)
    }
  }

  const togglerEdit = () => {
    if (isEditPostOpen) {
      setIsEditPostOpen(false)
    } else {
      setIsEditPostOpen(true)
    }
  }
  if (isEditPostOpen)
    return (
      <EditBudgetPost
        toggle={togglerEdit}
        refreshBudgets={refreshBudgets}
        budget={budget}
        post={post}
        setIsLoadingEditPost={setIsLoadingEditPost}
        isLoadingEditPost={isLoadingEditPost}
      />
    )
  return (
    <div className="overflow-hidden w-full rounded-xl border-2 border-gray-500 border-solid shadow-sm">
      <div className="flex justify-between items-center p-3 pb-2 w-full text-sm bg-gray-200">
        <span className="p2">{post.description}</span>

        <div className="btn-group">
          {isLoadingDeletePost || true ? (
            <button
              className="btn btn-primary btn-sm"
              type="button"
              title="Rediger post"
              onClick={togglerEdit}
            >
              <div title="Rediger Post">
                <div style={isLoadingEditPost ? { display: 'none' } : {}}>
                  Endre
                </div>
                <div style={isLoadingEditPost ? {} : { display: 'none' }}>
                  <Spinner animation="border" size="sm" />
                </div>
              </div>
            </button>
          ) : null}

          {isLoadingEditPost || true ? (
            <button
              className="text-white btn btn-error btn-sm"
              type="button"
              title="Slett post"
              onClick={toggler}
            >
              <DeleteBudgetPostModal
                isDeleteModalOpen={isDeleteModalOpen}
                toggler={toggler}
                refreshBudgets={refreshBudgets}
                post={post}
                setIsLoadingDeletePost={setIsLoadingDeletePost}
              />
              <div className={clsx(!isLoadingEditPost || 'hidden')}>Slett</div>
              <div className={clsx(isLoadingDeletePost || 'hidden')}>
                <Spinner animation="border" size="sm" />
              </div>
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col p-3">
        <b>Pris:</b> {getInNok(post.amountExMva)}
        <b>Dato:</b> {Moment(post.date).format('DD.MM.YYYY')}
      </div>
    </div>
  )
}

export default Post
