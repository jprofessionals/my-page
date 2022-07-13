import { Modal } from "react-bootstrap";
import ApiService from "../../services/api.service";
import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DeleteBudgetPostModal = ({
  isDeleteModalOpen,
  toggler,
  refreshBudgets,
  post,
  setIsLoadingPost,
}) => {
  const handleDeletePost = (e) => {
    setIsLoadingPost(true);
    e.preventDefault();
    ApiService.deleteBudgetPost(post.id).then(
      (response) => {
        refreshBudgets();
        setIsLoadingPost(false);
        toast.success("Slettet " + post.description, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      },
      (error) => {
        setIsLoadingPost(false);
        toast.error("Fikk ikke slettet posten, prøv igjen", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    );
  };
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
            <div className="btns">
              <button
                type="button btn"
                className="deletebtn btn"
                onClick={handleDeletePost}
              >
                Slett post
              </button>
              <button
                type="button btn"
                className="cancelbtn btn"
                onClick={toggler}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteBudgetPostModal;
