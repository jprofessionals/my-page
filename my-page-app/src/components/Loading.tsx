import { Spinner } from 'react-bootstrap'
import { PropsWithChildren } from 'react'

type Props = {
  isLoading: boolean
  loadingText?: string
}
export default function Loading({
  loadingText,
  isLoading,
  children = null,
}: PropsWithChildren<Props>) {
  if (isLoading)
    return (
      <div className="loadSpin d-flex align-items-center">
        <Spinner animation="border" className="spinn" />
        {loadingText ? <p>{loadingText}</p> : null}
      </div>
    )
  return <>{children}</>
}
