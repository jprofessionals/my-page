import React, { ReactElement } from 'react'
import Modal from 'react-modal'

type Props = {
  open: boolean
  onRequestClose: () => void
  header: string
  content: ReactElement
  optionalButton?: ReactElement
  confirmButton?: ReactElement
  cancelButton?: ReactElement
}

const SimpleModal = ({
  open,
  onRequestClose,
  header,
  content,
  optionalButton,
  confirmButton,
  cancelButton,
}: Props) => (
  <Modal
    isOpen={open}
    onRequestClose={onRequestClose}
    contentLabel={'Book'}
    ariaHideApp={false} // TODO: Pass in appElement instead so screen readers don't see main content when modal is opened
    style={{
      content: {
        width: 'auto',
        minWidth: '300px',
        margin: 'auto',
        maxHeight: '80vh',
        overflow: 'auto',
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)',
        borderRadius: '0.3rem',
      },
    }}
  >
    <div style={{ fontWeight: 'bold' }}>{header}</div>
    <div style={{ marginTop: '1rem' }}>{content}</div>
    <div
      style={{
        marginTop: '1rem',
        justifyContent: 'space-between',
        display: 'flex',
        gap: '2rem',
        width: '100%',
      }}
    >
      <div>{optionalButton}</div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {cancelButton}
        {confirmButton}
      </div>
    </div>
  </Modal>
)

export default SimpleModal
