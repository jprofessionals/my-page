// pages/ktu/resultater.tsx - Public KTU results page (no authentication required)
// Query params:
//   ?embed=true           - Hide header/footer for embedding on external sites
//   ?columns=2            - Show charts in 2 columns (default: 1)
//   ?hideResponseRate=true - Hide the response rate chart
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import TrendChart from '@/components/ktu/admin/TrendChart'
import { getPublicCompanyTrends } from '@/data/types'
import type { KtuCompanyTrendStatistics } from '@/data/types'

export default function KtuResultaterPage() {
  const router = useRouter()
  const [trendData, setTrendData] = useState<KtuCompanyTrendStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Query parameters for embedding
  const isEmbed = router.query.embed === 'true'
  const columns = router.query.columns === '2' ? 2 : 1
  const hideResponseRate = router.query.hideResponseRate === 'true'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getPublicCompanyTrends()
      if (response.data) {
        setTrendData(response.data)
      }
    } catch (err) {
      console.error('Failed to load KTU data:', err)
      setError('Kunne ikke laste KTU-data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Kundetilfredshet | JPro</title>
        <meta
          name="description"
          content="Se JPros kundetilfredshetsresultater over tid"
        />
      </Head>

      <div className={isEmbed ? 'bg-transparent' : 'min-h-screen bg-gray-50'}>
        {/* Header - hidden in embed mode */}
        {!isEmbed && (
          <header className="bg-[#1a1a1a] shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-6">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/jpro-logo.svg"
                  alt="JPro"
                  width={120}
                  height={48}
                  priority
                />
                <div className="border-l border-gray-600 pl-4">
                  <h1 className="text-2xl font-bold text-white">
                    Kundetilfredshet
                  </h1>
                  <p className="text-gray-400">
                    Årlige undersøkelser blant våre kunder
                  </p>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className={isEmbed ? 'p-4' : 'max-w-5xl mx-auto px-4 py-8'}>
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Laster resultater...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">
              {error}
            </div>
          )}

          {!loading && !error && trendData && (
            <div className="space-y-8">
              {/* Response rate trend */}
              {!hideResponseRate && trendData.yearlyStatistics && trendData.yearlyStatistics.length > 0 && (
                <TrendChart
                  data={trendData.yearlyStatistics
                    .sort((a, b) => a.year - b.year)
                    .map((ys) => ({
                      year: ys.year,
                      value: ys.responseRate,
                      responseCount: ys.totalResponses,
                    }))}
                  title="Svarprosent over tid"
                  color="#10B981"
                  height={200}
                  minValue={0}
                  maxValue={100}
                  valueSuffix="%"
                />
              )}

              {/* Per-question trends */}
              {trendData.questionTrends && trendData.questionTrends.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Score per spørsmål over tid
                  </h2>
                  <div
                    className={
                      columns === 2
                        ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                        : 'space-y-4'
                    }
                  >
                    {trendData.questionTrends.map((qt) => {
                      const responseCounts = qt.yearlyResponseCounts || {}
                      const chartData = Object.entries(qt.yearlyAverages || {})
                        .map(([yearStr, value]) => ({
                          year: parseInt(yearStr),
                          value: value ?? null,
                          responseCount:
                            responseCounts[yearStr] ??
                            responseCounts[parseInt(yearStr) as unknown as string],
                        }))
                        .sort((a, b) => a.year - b.year)

                      return (
                        <TrendChart
                          key={qt.questionCode}
                          data={chartData}
                          title={qt.questionText}
                          color="#3B82F6"
                          height={180}
                          showScaleHint
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Footer note - hidden in embed mode */}
              {!isEmbed && (
                <div className="text-center text-sm text-gray-400 pt-8">
                  <p>
                    JPro gjennomfører årlige kundetilfredshetsundersøkelser for å
                    kontinuerlig forbedre våre tjenester.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
