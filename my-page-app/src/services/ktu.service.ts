// Conditionally import openapi-client only in browser environment
if (typeof window !== 'undefined') {
  import('@/services/openapi-client')
}

import {
  getKtuRounds,
  createKtuRound,
  getKtuRound,
  updateKtuRound,
  deleteKtuRound,
  getKtuOrganizations,
  createKtuOrganization,
  getKtuOrganization,
  updateKtuOrganization,
  getKtuContacts,
  createKtuContact,
  getKtuContact,
  updateKtuContact,
  getKtuQuestions,
  createKtuQuestion,
  updateKtuQuestion,
  getKtuRoundQuestions,
  addKtuRoundQuestion,
  updateKtuRoundQuestion,
  removeKtuRoundQuestion,
  copyKtuRoundQuestions,
  initKtuRoundQuestionsFromTemplate,
  previewKtuCsv,
  importHistoricalKtu,
  getKtuAssignments,
  createKtuAssignment,
  getKtuAssignment,
  deleteKtuAssignment,
  getKtuInvitations,
  sendKtuInvitations,
  sendKtuReminders,
  previewKtuEmail,
  getKtuConsultants,
  syncUsersFromFlowcase,
  getConsultantAliases,
  createConsultantAlias,
  deleteConsultantAlias,
  getKtuUsers,
  getKtuRoundStatistics,
  getKtuRoundResponses,
  getKtuStatisticsByConsultant,
  getKtuCompanyTrends,
  getKtuConsultantsTrends,
  updateKtuResponse,
  deleteKtuResponse,
  updateKtuInvitation,
  deleteKtuInvitation,
  getKtuMyStatistics,
  getKtuMyTrends,
  getKtuMyResponses,
  getKtuConsultantStatisticsAdmin,
  getKtuConsultantTrendsAdmin,
  getKtuConsultantResponsesAdmin,
  // Color Themes
  getKtuColorThemes,
  getKtuColorTheme,
  createKtuColorTheme,
  updateKtuColorTheme,
  deleteKtuColorTheme,
  // Logo
  uploadKtuRoundLogo,
  deleteKtuRoundLogo,
  // Test Survey
  createKtuTestSurvey,
} from '@/data/types'
import type {
  KtuRound,
  KtuRoundStatus,
  KtuCustomerOrganization,
  KtuCustomerContact,
  KtuQuestion,
  KtuQuestionType,
  CreateKtuQuestion,
  UpdateKtuQuestion,
  KtuRoundQuestion,
  AddKtuRoundQuestion,
  UpdateKtuRoundQuestion,
  CreateKtuRound,
  UpdateKtuRound,
  CreateKtuOrganization,
  UpdateKtuOrganization,
  CreateKtuContact,
  UpdateKtuContact,
  KtuCsvPreview,
  KtuImportField,
  KtuImportResult,
  KtuImportError,
  KtuAssignment,
  CreateKtuAssignment,
  KtuInvitation,
  KtuInvitationStatus,
  KtuConsultant,
  KtuSendInvitationsResult,
  KtuSendRemindersResult,
  UserSyncResult,
  ConsultantAlias,
  CreateConsultantAliasRequest,
  KtuUser,
  UnmatchedConsultant,
  SuggestedMatch,
  KtuRoundStatistics,
  KtuQuestionStatistics,
  KtuResponseSummary,
  KtuQuestionResponse,
  KtuConsultantStatistics,
  KtuCompanyTrendStatistics,
  KtuYearlyStatistics,
  KtuQuestionTrend,
  KtuConsultantYearlyStats,
  KtuConsultantYearData,
  UpdateKtuResponse,
  UpdateKtuInvitation,
  KtuConsultantOwnStatistics,
  KtuQuestionAverage,
  KtuEmailPreview,
  // Color Themes
  KtuColorTheme,
  CreateKtuColorTheme,
  UpdateKtuColorTheme,
  // Appearance
  SurveyAppearance,
  // Test Survey
  CreateKtuTestSurvey,
  KtuTestSurveyResult,
} from '@/data/types'

// Re-export types for convenience
export type {
  KtuRound,
  KtuRoundStatus,
  KtuCustomerOrganization,
  KtuCustomerContact,
  KtuQuestion,
  KtuQuestionType,
  CreateKtuQuestion,
  UpdateKtuQuestion,
  KtuRoundQuestion,
  AddKtuRoundQuestion,
  UpdateKtuRoundQuestion,
  CreateKtuRound,
  UpdateKtuRound,
  CreateKtuOrganization,
  UpdateKtuOrganization,
  CreateKtuContact,
  UpdateKtuContact,
  KtuCsvPreview,
  KtuImportField,
  KtuImportResult,
  KtuImportError,
  KtuAssignment,
  CreateKtuAssignment,
  KtuInvitation,
  KtuInvitationStatus,
  KtuConsultant,
  KtuSendInvitationsResult,
  KtuSendRemindersResult,
  UserSyncResult,
  ConsultantAlias,
  CreateConsultantAliasRequest,
  KtuUser,
  UnmatchedConsultant,
  SuggestedMatch,
  KtuRoundStatistics,
  KtuQuestionStatistics,
  KtuResponseSummary,
  KtuQuestionResponse,
  KtuConsultantStatistics,
  KtuCompanyTrendStatistics,
  KtuYearlyStatistics,
  KtuQuestionTrend,
  KtuConsultantYearlyStats,
  KtuConsultantYearData,
  UpdateKtuResponse,
  UpdateKtuInvitation,
  KtuConsultantOwnStatistics,
  KtuQuestionAverage,
  KtuEmailPreview,
  // Color Themes
  KtuColorTheme,
  CreateKtuColorTheme,
  UpdateKtuColorTheme,
  // Appearance
  SurveyAppearance,
  // Test Survey
  CreateKtuTestSurvey,
  KtuTestSurveyResult,
}

const ktuService = {
  // Rounds
  getRounds: async (status?: KtuRoundStatus) => {
    return getKtuRounds({ query: { status } })
  },

  getRound: async (roundId: number) => {
    return getKtuRound({ path: { roundId } })
  },

  createRound: async (data: CreateKtuRound) => {
    return createKtuRound({ body: data })
  },

  updateRound: async (roundId: number, data: UpdateKtuRound) => {
    return updateKtuRound({ path: { roundId }, body: data })
  },

  deleteRound: async (roundId: number) => {
    return deleteKtuRound({ path: { roundId } })
  },

  // Organizations
  getOrganizations: async (activeOnly: boolean = true) => {
    return getKtuOrganizations({ query: { activeOnly } })
  },

  getOrganization: async (organizationId: number) => {
    return getKtuOrganization({ path: { organizationId } })
  },

  createOrganization: async (data: CreateKtuOrganization) => {
    return createKtuOrganization({ body: data })
  },

  updateOrganization: async (organizationId: number, data: UpdateKtuOrganization) => {
    return updateKtuOrganization({ path: { organizationId }, body: data })
  },

  // Contacts
  getContacts: async (organizationId?: number, activeOnly: boolean = true) => {
    return getKtuContacts({ query: { organizationId, activeOnly } })
  },

  getContact: async (contactId: number) => {
    return getKtuContact({ path: { contactId } })
  },

  createContact: async (data: CreateKtuContact) => {
    return createKtuContact({ body: data })
  },

  updateContact: async (contactId: number, data: UpdateKtuContact) => {
    return updateKtuContact({ path: { contactId }, body: data })
  },

  // Questions (global template)
  getQuestions: async (activeOnly: boolean = true) => {
    return getKtuQuestions({ query: { activeOnly } })
  },

  createQuestion: async (data: CreateKtuQuestion) => {
    return createKtuQuestion({ body: data })
  },

  updateQuestion: async (questionId: number, data: UpdateKtuQuestion) => {
    return updateKtuQuestion({ path: { questionId }, body: data })
  },

  // Round Questions (per-round configuration)
  getRoundQuestions: async (roundId: number, activeOnly: boolean = false) => {
    return getKtuRoundQuestions({ path: { roundId }, query: { activeOnly } })
  },

  addRoundQuestion: async (roundId: number, data: AddKtuRoundQuestion) => {
    return addKtuRoundQuestion({ path: { roundId }, body: data })
  },

  updateRoundQuestion: async (roundId: number, questionId: number, data: UpdateKtuRoundQuestion) => {
    return updateKtuRoundQuestion({ path: { roundId, questionId }, body: data })
  },

  removeRoundQuestion: async (roundId: number, questionId: number) => {
    return removeKtuRoundQuestion({ path: { roundId, questionId } })
  },

  copyRoundQuestionsFromRound: async (roundId: number, sourceRoundId: number) => {
    return copyKtuRoundQuestions({ path: { roundId, sourceRoundId } })
  },

  initRoundQuestionsFromTemplate: async (roundId: number) => {
    return initKtuRoundQuestionsFromTemplate({ path: { roundId } })
  },

  // Import
  previewCsv: async (file: File) => {
    return previewKtuCsv({
      body: { file },
    })
  },

  importHistorical: async (
    file: File,
    dryRun: boolean = true,
    skipUnmatchedConsultants: boolean = false,
    columnMapping?: Record<string, number | null>
  ) => {
    return importHistoricalKtu({
      query: { dryRun, skipUnmatchedConsultants },
      body: {
        file,
        columnMapping: columnMapping ? JSON.stringify(columnMapping) : undefined,
      },
    })
  },

  // Assignments
  getAssignments: async (roundId: number) => {
    return getKtuAssignments({ path: { roundId } })
  },

  getAssignment: async (roundId: number, assignmentId: number) => {
    return getKtuAssignment({ path: { roundId, assignmentId } })
  },

  createAssignment: async (roundId: number, data: CreateKtuAssignment) => {
    return createKtuAssignment({ path: { roundId }, body: data })
  },

  deleteAssignment: async (roundId: number, assignmentId: number) => {
    return deleteKtuAssignment({ path: { roundId, assignmentId } })
  },

  // Invitations
  getInvitations: async (roundId: number, status?: KtuInvitationStatus) => {
    return getKtuInvitations({ path: { roundId }, query: { status } })
  },

  sendInvitations: async (roundId: number) => {
    return sendKtuInvitations({ path: { roundId } })
  },

  sendReminders: async (roundId: number) => {
    return sendKtuReminders({ path: { roundId } })
  },

  previewEmail: async (roundId: number, type: 'invitation' | 'reminder') => {
    return previewKtuEmail({ path: { roundId }, query: { type } })
  },

  // Consultants
  getConsultants: async () => {
    return getKtuConsultants()
  },

  // User Sync
  syncUsersFromFlowcase: async () => {
    return syncUsersFromFlowcase()
  },

  // Consultant Aliases
  getConsultantAliases: async () => {
    return getConsultantAliases()
  },

  createConsultantAlias: async (data: CreateConsultantAliasRequest) => {
    return createConsultantAlias({ body: data })
  },

  deleteConsultantAlias: async (aliasId: number) => {
    return deleteConsultantAlias({ path: { aliasId } })
  },

  // KTU Users (for alias mapping)
  getKtuUsers: async () => {
    return getKtuUsers()
  },

  // Statistics
  getRoundStatistics: async (roundId: number) => {
    return getKtuRoundStatistics({ path: { roundId } })
  },

  getRoundResponses: async (roundId: number) => {
    return getKtuRoundResponses({ path: { roundId } })
  },

  getStatisticsByConsultant: async (roundId: number) => {
    return getKtuStatisticsByConsultant({ path: { roundId } })
  },

  // Trend Statistics
  getCompanyTrends: async () => {
    return getKtuCompanyTrends()
  },

  getConsultantsTrends: async () => {
    return getKtuConsultantsTrends()
  },

  // Response Admin Operations
  updateResponse: async (responseId: number, data: UpdateKtuResponse) => {
    return updateKtuResponse({ path: { responseId }, body: data })
  },

  deleteResponse: async (responseId: number) => {
    return deleteKtuResponse({ path: { responseId } })
  },

  // Invitation Admin Operations
  updateInvitation: async (invitationId: number, data: UpdateKtuInvitation) => {
    return updateKtuInvitation({ path: { invitationId }, body: data })
  },

  deleteInvitation: async (invitationId: number) => {
    return deleteKtuInvitation({ path: { invitationId } })
  },

  // My KTU (Consultant's own data)
  getMyStatistics: async () => {
    return getKtuMyStatistics()
  },

  getMyTrends: async () => {
    return getKtuMyTrends()
  },

  getMyResponses: async (roundId?: number) => {
    return getKtuMyResponses({ query: { roundId } })
  },

  // Admin endpoints for viewing any consultant's KTU data
  getConsultantStatisticsAdmin: async (consultantId: number) => {
    return getKtuConsultantStatisticsAdmin({ path: { consultantId } })
  },

  getConsultantTrendsAdmin: async (consultantId: number) => {
    return getKtuConsultantTrendsAdmin({ path: { consultantId } })
  },

  getConsultantResponsesAdmin: async (consultantId: number, roundId?: number) => {
    return getKtuConsultantResponsesAdmin({ path: { consultantId }, query: { roundId } })
  },

  // Color Themes
  getColorThemes: async () => {
    return getKtuColorThemes()
  },

  getColorTheme: async (themeId: number) => {
    return getKtuColorTheme({ path: { themeId } })
  },

  createColorTheme: async (data: CreateKtuColorTheme) => {
    return createKtuColorTheme({ body: data })
  },

  updateColorTheme: async (themeId: number, data: UpdateKtuColorTheme) => {
    return updateKtuColorTheme({ path: { themeId }, body: data })
  },

  deleteColorTheme: async (themeId: number) => {
    return deleteKtuColorTheme({ path: { themeId } })
  },

  // Logo
  uploadLogo: async (roundId: number, file: File) => {
    return uploadKtuRoundLogo({ path: { roundId }, body: { file } })
  },

  deleteLogo: async (roundId: number) => {
    return deleteKtuRoundLogo({ path: { roundId } })
  },

  // Test Survey
  createTestSurvey: async (roundId: number, data: CreateKtuTestSurvey) => {
    return createKtuTestSurvey({ path: { roundId }, body: data })
  },
}

export default ktuService
