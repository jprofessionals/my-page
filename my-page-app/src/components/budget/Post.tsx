import React, { useState } from 'react'
import { Card, Button, Spinner } from 'react-bootstrap'
import Moment from 'moment'
import DeleteBudgetPostModal from './DeleteBudgetPostModal'
import EditBudgetPost from './EditBudgetPost'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faEdit } from '@fortawesome/free-solid-svg-icons'
import { Budget } from '@/types'

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
  return (
    <div className="post">
      <Card
        border={postInFuture() ? 'grey' : 'dark'}
        style={isEditPostOpen ? { display: 'none' } : {}}
      >
        <div className="postHeaderDiv">
          <Card.Header className="postHeader">
            <div className="headerPost">
              <b>{post.description}</b>
              <div className="rightBtnsDiv">
                <div
                  style={
                    isLoadingDeletePost || post.locked
                      ? { display: 'none' }
                      : {}
                  }
                >
                  <Button
                    className="leftBtn"
                    type="button"
                    title="Rediger post"
                    onClick={togglerEdit}
                  >
                    <div title="Rediger Post">
                      <div style={isLoadingEditPost ? { display: 'none' } : {}}>
                        <FontAwesomeIcon icon={faEdit} />
                      </div>
                      <div style={isLoadingEditPost ? {} : { display: 'none' }}>
                        <Spinner animation="border" size="sm" />
                      </div>
                    </div>
                  </Button>
                </div>
                <div
                  style={
                    isLoadingEditPost || post.locked ? { display: 'none' } : {}
                  }
                >
                  <Button
                    className="removePostBtn"
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
                    <div style={isLoadingDeletePost ? { display: 'none' } : {}}>
                      <FontAwesomeIcon icon={faTrash} />
                    </div>
                    <div style={isLoadingDeletePost ? {} : { display: 'none' }}>
                      <Spinner animation="border" size="sm" />
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </Card.Header>
        </div>
        <Card.Body>
          <ul className="postList">
            <li>
              <b>Pris:</b>{' '}
              {post.amountExMva.toLocaleString('no-NO', {
                maximumFractionDigits: 2,
                style: 'currency',
                currency: 'NOK',
              })}
            </li>
            <li>
              <b>Dato:</b> {Moment(post.date).format('DD.MM.YYYY')}
            </li>
          </ul>
        </Card.Body>
      </Card>
      <div style={isEditPostOpen ? {} : { display: 'none' }}>
        <EditBudgetPost
          toggle={togglerEdit}
          refreshBudgets={refreshBudgets}
          budget={budget}
          post={post}
          setIsLoadingEditPost={setIsLoadingEditPost}
          isLoadingEditPost={isLoadingEditPost}
        />
      </div>
    </div>
  )
}

export default Post
