import type { Wish } from '@/types/cabinLottery.types'

interface WishesByUserProps {
  wishes: Wish[]
}

interface UserWishData {
  userName: string
  userEmail: string
  wishes: Wish[]
}

export default function WishesByUser({ wishes }: WishesByUserProps) {
  // Group wishes by user
  const wishesByUser = wishes.reduce<Record<number, UserWishData>>(
    (acc, wish) => {
      if (!acc[wish.userId]) {
        acc[wish.userId] = {
          userName: wish.userName || 'Ukjent',
          userEmail: wish.userEmail || '',
          wishes: [],
        }
      }
      acc[wish.userId].wishes.push(wish)
      return acc
    },
    {},
  )

  const users = Object.entries(wishesByUser).sort((a, b) =>
    a[1].userName.localeCompare(b[1].userName),
  )

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bruker
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Antall ønsker
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ønsker (prioritert)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(([userId, userData]) => (
            <tr key={userId} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {userData.userName}
                </div>
                <div className="text-xs text-gray-500">
                  {userData.userEmail}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {userData.wishes.length}
              </td>
              <td className="px-4 py-3">
                <div className="space-y-2">
                  {userData.wishes
                    .sort((a, b) => a.priority - b.priority)
                    .map((wish) => (
                      <div key={wish.id} className="text-sm">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs mr-2">
                          {wish.priority}
                        </span>
                        <span className="font-medium text-gray-900">
                          {wish.periodDescription}
                        </span>
                        <span className="text-gray-600">
                          {' '}
                          → {wish.desiredApartmentNames.join(', ')}
                        </span>
                        {wish.comment && (
                          <div className="ml-7 text-xs text-gray-500 italic mt-1">
                            &ldquo;{wish.comment}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
