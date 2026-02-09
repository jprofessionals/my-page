'use client'

import { useState } from 'react'
import OverviewTab from './analytics/OverviewTab'
import EvaluationTab from './analytics/EvaluationTab'
import ConsultantTab from './analytics/ConsultantTab'
import CompetencyBaseTab from './analytics/CompetencyBaseTab'
import CustomerTab from './analytics/CustomerTab'
import Link from 'next/link'

const TABS = [
  { id: 'overview', label: 'Oversikt' },
  { id: 'evaluation', label: 'Evaluering' },
  { id: 'consultants', label: 'Konsulenter' },
  { id: 'competency', label: 'Konsulentbasen' },
  { id: 'customers', label: 'Kunder' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function SalesPipelineAnalyticsComponent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salgsanalyse</h1>
        <Link href="/salgstavle" className="btn btn-outline btn-sm">
          ← Tilbake til salgstavle
        </Link>
      </div>

      <div className="tabs tabs-boxed mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'evaluation' && <EvaluationTab />}
      {activeTab === 'consultants' && <ConsultantTab />}
      {activeTab === 'competency' && <CompetencyBaseTab />}
      {activeTab === 'customers' && <CustomerTab />}
    </div>
  )
}
