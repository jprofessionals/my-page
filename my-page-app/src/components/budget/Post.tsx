import { useState } from 'react'
import moment from 'moment'
import DeleteBudgetPostModal from './DeleteBudgetPostModal'
import EditBudgetPost from './EditBudgetPost'
import { Budget } from '@/types'
import getInNok from '@/utils/getInNok'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLock,
  faLockOpen,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons'

type Props = {
  budget: Budget
  refreshBudgets: Function
  showActions: boolean
  post: any
}
const Post = ({ refreshBudgets, post, budget, showActions }: Props) => {
  const [isLoadingEditPost, setIsLoadingEditPost] = useState(false)
  const [isEditPostOpen, setIsEditPostOpen] = useState(false)

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
        <span className="flex gap-2 items-center p-1">
          {showActions ? (
            <FontAwesomeIcon icon={post.locked ? faLock : faLockOpen} />
          ) : null}
          {post.description}
        </span>

        {showActions ? (
          <div className="btn-group">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              title="Rediger post"
              onClick={togglerEdit}
              disabled={post.locked}
            >
              <div title="Rediger Post">
                {isLoadingEditPost ? (
                  <FontAwesomeIcon
                    icon={faRefresh}
                    className="animate-spin"
                    size="sm"
                  />
                ) : (
                  'Endre'
                )}
              </div>
            </button>
            <DeleteBudgetPostModal
              refreshBudgets={refreshBudgets}
              post={post}
            />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col p-3">
        <b>Pris:</b> {getInNok(post.amountExMva)}
        <b>Dato:</b> {moment(post.date).format('DD.MM.YYYY')}
      </div>
    </div>
  )
}

export default Post
