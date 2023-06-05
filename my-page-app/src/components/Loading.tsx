import { faRefresh } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
      <div className="flex justify-center mt-[30%]">
        <FontAwesomeIcon icon={faRefresh} className="animate-spin" size="xl" />
        {loadingText ? <p>{loadingText}</p> : null}
      </div>
    )
  return <>{children}</>
}
