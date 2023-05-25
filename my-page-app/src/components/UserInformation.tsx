import Moment from 'moment'
import { useAuthContext } from '@/providers/AuthProvider'

function UserInformation() {
  const { user } = useAuthContext()

  if (!user) return null

  return (
    <div className="py-8 px-4 prose prose-h2:mb-0 prose-h2:font-light prose-p:font-light">
      <h2>Hei, {user?.givenName}</h2>
      <p className="flex flex-col">
        E-post: {user?.email}
        {user.startDate ? (
          <span>Startdato: {Moment(user?.startDate).format('DD.MM.YYYY')}</span>
        ) : null}
      </p>
    </div>
  )
}

export default UserInformation
