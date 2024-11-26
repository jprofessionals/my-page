import Modal from 'react-modal'
import { ReactElement } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  label: string
  children: ReactElement
}

const MonthOverviewModal = ({ open, onClose, label, children }: Props) => (
  <Modal
    isOpen={open}
    onRequestClose={onClose}
    contentLabel={label}
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
      },
    }}
  >
    {children}
  </Modal>
)

export default MonthOverviewModal
