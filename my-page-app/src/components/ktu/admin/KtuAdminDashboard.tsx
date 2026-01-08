'use client'

import { useState } from 'react'
import DashboardTab from './DashboardTab'
import SurveysTab from './SurveysTab'
import CustomersTab from './CustomersTab'
import SurveyDetailView from './SurveyDetailView'
import ktuService, { KtuRound } from '@/services/ktu.service'

type Tab = 'oversikt' | 'undersøkelser' | 'kunder'

function KtuAdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<Tab>('oversikt')
  const [selectedSurvey, setSelectedSurvey] = useState<KtuRound | null>(null)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'oversikt', label: 'Oversikt' },
    { id: 'undersøkelser', label: 'Undersøkelser' },
    { id: 'kunder', label: 'Kunder' },
  ]

  const handleSelectSurvey = (survey: KtuRound) => {
    setSelectedSurvey(survey)
  }

  const handleBackToList = () => {
    setSelectedSurvey(null)
  }

  const handleSurveyUpdate = async () => {
    if (selectedSurvey) {
      const response = await ktuService.getRound(selectedSurvey.id)
      if (response.data) {
        setSelectedSurvey(response.data)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KTU - Kundetilfredshetsundersøkelse</h1>
          <p className="mt-2 text-gray-600">
            Administrer undersøkelser, kunder og se statistikk
          </p>
        </div>

        {/* Tabs - hide when in survey detail view */}
        {!(activeTab === 'undersøkelser' && selectedSurvey) && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSelectedSurvey(null)
                  }}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === 'oversikt' && <DashboardTab />}
          {activeTab === 'undersøkelser' && (
            selectedSurvey ? (
              <SurveyDetailView survey={selectedSurvey} onBack={handleBackToList} onUpdate={handleSurveyUpdate} />
            ) : (
              <SurveysTab onSelectSurvey={handleSelectSurvey} />
            )
          )}
          {activeTab === 'kunder' && <CustomersTab />}
        </div>
      </div>
    </div>
  )
}

export default function KtuAdminDashboard() {
  return <KtuAdminDashboardContent />
}
