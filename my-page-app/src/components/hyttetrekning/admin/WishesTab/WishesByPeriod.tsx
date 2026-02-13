import type { Wish } from '@/types/cabinLottery.types'

interface WishesByPeriodProps {
  wishes: Wish[]
}

interface PeriodWishData {
  periodDescription: string
  wishes: Wish[]
}

interface UserWishData {
  userName: string
  userEmail: string
  priority: number
  apartments: string[]
  comment?: string | null
}

export default function WishesByPeriod({ wishes }: WishesByPeriodProps) {
  // Group wishes by period
  const wishesByPeriod = wishes.reduce<Record<string, PeriodWishData>>(
    (acc, wish) => {
      if (!acc[wish.periodId]) {
        acc[wish.periodId] = {
          periodDescription: wish.periodDescription,
          wishes: [],
        }
      }
      acc[wish.periodId].wishes.push(wish)
      return acc
    },
    {},
  )

  return (
    <div className="space-y-6">
      {Object.entries(wishesByPeriod).map(([periodId, periodData]) => {
        // Count unique users for this period
        const uniqueUsers = new Set(periodData.wishes.map((w) => w.userId))

        // Count apartment preferences
        const apartmentCounts: Record<string, number> = {}
        periodData.wishes.forEach((wish) => {
          wish.desiredApartmentNames.forEach((aptName) => {
            apartmentCounts[aptName] = (apartmentCounts[aptName] || 0) + 1
          })
        })

        // Group by user
        const userWishes: Record<number, UserWishData> = {}
        periodData.wishes.forEach((wish) => {
          if (!userWishes[wish.userId]) {
            userWishes[wish.userId] = {
              userName: wish.userName || 'Ukjent',
              userEmail: wish.userEmail || '',
              priority: wish.priority,
              apartments: wish.desiredApartmentNames,
              comment: wish.comment,
            }
          }
        })

        const sortedUsers = Object.entries(userWishes).sort(
          (a, b) => a[1].priority - b[1].priority,
        )

        return (
          <div
            key={periodId}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {periodData.periodDescription}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-gray-600">
                  👥 {uniqueUsers.size}{' '}
                  {uniqueUsers.size === 1 ? 'bruker' : 'brukere'}
                </p>
                {Object.keys(apartmentCounts).length > 0 && (
                  <div className="flex gap-3 text-xs">
                    {Object.entries(apartmentCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([aptName, count]) => (
                        <span
                          key={aptName}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {aptName}: {count}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Pri
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Bruker
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ønskede enheter
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Kommentar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsers.map(([userId, userWish]) => (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                          {userWish.priority}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {userWish.userName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {userWish.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-900">
                          {userWish.apartments.join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {userWish.comment && (
                          <div className="text-xs text-gray-500 italic">
                            &ldquo;{userWish.comment}&rdquo;
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
