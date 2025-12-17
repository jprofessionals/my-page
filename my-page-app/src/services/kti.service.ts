// Conditionally import openapi-client only in browser environment
if (typeof window !== 'undefined') {
  import('@/services/openapi-client')
}

import {
  getKtiRounds,
  createKtiRound,
  getKtiRound,
  updateKtiRound,
  deleteKtiRound,
  getKtiOrganizations,
  createKtiOrganization,
  getKtiOrganization,
  updateKtiOrganization,
  getKtiContacts,
  createKtiContact,
  getKtiContact,
  updateKtiContact,
  getKtiQuestions,
  createKtiQuestion,
  updateKtiQuestion,
  getKtiRoundQuestions,
  addKtiRoundQuestion,
  updateKtiRoundQuestion,
  removeKtiRoundQuestion,
  copyKtiRoundQuestions,
  initKtiRoundQuestionsFromTemplate,
  previewKtiCsv,
  importHistoricalKti,
  getKtiAssignments,
  createKtiAssignment,
  getKtiAssignment,
  deleteKtiAssignment,
  getKtiInvitations,
  sendKtiInvitations,
  sendKtiReminders,
  getKtiConsultants,
  syncUsersFromFlowcase,
  getConsultantAliases,
  createConsultantAlias,
  deleteConsultantAlias,
  getKtiUsers,
  getKtiRoundStatistics,
  getKtiRoundResponses,
  getKtiStatisticsByConsultant,
  getKtiCompanyTrends,
  getKtiConsultantsTrends,
  updateKtiResponse,
  deleteKtiResponse,
  updateKtiInvitation,
  deleteKtiInvitation,
  getKtiMyStatistics,
  getKtiMyTrends,
  getKtiMyResponses,
  getKtiConsultantStatisticsAdmin,
  getKtiConsultantTrendsAdmin,
  getKtiConsultantResponsesAdmin,
} from '@/data/types'
import type {
  KtiRound,
  KtiRoundStatus,
  KtiCustomerOrganization,
  KtiCustomerContact,
  KtiQuestion,
  KtiQuestionType,
  CreateKtiQuestion,
  UpdateKtiQuestion,
  KtiRoundQuestion,
  AddKtiRoundQuestion,
  UpdateKtiRoundQuestion,
  CreateKtiRound,
  UpdateKtiRound,
  CreateKtiOrganization,
  UpdateKtiOrganization,
  CreateKtiContact,
  UpdateKtiContact,
  KtiCsvPreview,
  KtiImportField,
  KtiImportResult,
  KtiImportError,
  KtiAssignment,
  CreateKtiAssignment,
  KtiInvitation,
  KtiInvitationStatus,
  KtiConsultant,
  KtiSendInvitationsResult,
  KtiSendRemindersResult,
  UserSyncResult,
  ConsultantAlias,
  CreateConsultantAliasRequest,
  KtiUser,
  UnmatchedConsultant,
  SuggestedMatch,
  KtiRoundStatistics,
  KtiQuestionStatistics,
  KtiResponseSummary,
  KtiQuestionResponse,
  KtiConsultantStatistics,
  KtiCompanyTrendStatistics,
  KtiYearlyStatistics,
  KtiQuestionTrend,
  KtiConsultantYearlyStats,
  KtiConsultantYearData,
  UpdateKtiResponse,
  UpdateKtiInvitation,
  KtiConsultantOwnStatistics,
  KtiQuestionAverage,
} from '@/data/types'

// Re-export types for convenience
export type {
  KtiRound,
  KtiRoundStatus,
  KtiCustomerOrganization,
  KtiCustomerContact,
  KtiQuestion,
  KtiQuestionType,
  CreateKtiQuestion,
  UpdateKtiQuestion,
  KtiRoundQuestion,
  AddKtiRoundQuestion,
  UpdateKtiRoundQuestion,
  CreateKtiRound,
  UpdateKtiRound,
  CreateKtiOrganization,
  UpdateKtiOrganization,
  CreateKtiContact,
  UpdateKtiContact,
  KtiCsvPreview,
  KtiImportField,
  KtiImportResult,
  KtiImportError,
  KtiAssignment,
  CreateKtiAssignment,
  KtiInvitation,
  KtiInvitationStatus,
  KtiConsultant,
  KtiSendInvitationsResult,
  KtiSendRemindersResult,
  UserSyncResult,
  ConsultantAlias,
  CreateConsultantAliasRequest,
  KtiUser,
  UnmatchedConsultant,
  SuggestedMatch,
  KtiRoundStatistics,
  KtiQuestionStatistics,
  KtiResponseSummary,
  KtiQuestionResponse,
  KtiConsultantStatistics,
  KtiCompanyTrendStatistics,
  KtiYearlyStatistics,
  KtiQuestionTrend,
  KtiConsultantYearlyStats,
  KtiConsultantYearData,
  UpdateKtiResponse,
  UpdateKtiInvitation,
  KtiConsultantOwnStatistics,
  KtiQuestionAverage,
}

const ktiService = {
  // Rounds
  getRounds: async (status?: KtiRoundStatus) => {
    return getKtiRounds({ query: { status } })
  },

  getRound: async (roundId: number) => {
    return getKtiRound({ path: { roundId } })
  },

  createRound: async (data: CreateKtiRound) => {
    return createKtiRound({ body: data })
  },

  updateRound: async (roundId: number, data: UpdateKtiRound) => {
    return updateKtiRound({ path: { roundId }, body: data })
  },

  deleteRound: async (roundId: number) => {
    return deleteKtiRound({ path: { roundId } })
  },

  // Organizations
  getOrganizations: async (activeOnly: boolean = true) => {
    return getKtiOrganizations({ query: { activeOnly } })
  },

  getOrganization: async (organizationId: number) => {
    return getKtiOrganization({ path: { organizationId } })
  },

  createOrganization: async (data: CreateKtiOrganization) => {
    return createKtiOrganization({ body: data })
  },

  updateOrganization: async (organizationId: number, data: UpdateKtiOrganization) => {
    return updateKtiOrganization({ path: { organizationId }, body: data })
  },

  // Contacts
  getContacts: async (organizationId?: number, activeOnly: boolean = true) => {
    return getKtiContacts({ query: { organizationId, activeOnly } })
  },

  getContact: async (contactId: number) => {
    return getKtiContact({ path: { contactId } })
  },

  createContact: async (data: CreateKtiContact) => {
    return createKtiContact({ body: data })
  },

  updateContact: async (contactId: number, data: UpdateKtiContact) => {
    return updateKtiContact({ path: { contactId }, body: data })
  },

  // Questions (global template)
  getQuestions: async (activeOnly: boolean = true) => {
    return getKtiQuestions({ query: { activeOnly } })
  },

  createQuestion: async (data: CreateKtiQuestion) => {
    return createKtiQuestion({ body: data })
  },

  updateQuestion: async (questionId: number, data: UpdateKtiQuestion) => {
    return updateKtiQuestion({ path: { questionId }, body: data })
  },

  // Round Questions (per-round configuration)
  getRoundQuestions: async (roundId: number, activeOnly: boolean = false) => {
    return getKtiRoundQuestions({ path: { roundId }, query: { activeOnly } })
  },

  addRoundQuestion: async (roundId: number, data: AddKtiRoundQuestion) => {
    return addKtiRoundQuestion({ path: { roundId }, body: data })
  },

  updateRoundQuestion: async (roundId: number, questionId: number, data: UpdateKtiRoundQuestion) => {
    return updateKtiRoundQuestion({ path: { roundId, questionId }, body: data })
  },

  removeRoundQuestion: async (roundId: number, questionId: number) => {
    return removeKtiRoundQuestion({ path: { roundId, questionId } })
  },

  copyRoundQuestionsFromRound: async (roundId: number, sourceRoundId: number) => {
    return copyKtiRoundQuestions({ path: { roundId, sourceRoundId } })
  },

  initRoundQuestionsFromTemplate: async (roundId: number) => {
    return initKtiRoundQuestionsFromTemplate({ path: { roundId } })
  },

  // Import
  previewCsv: async (file: File) => {
    return previewKtiCsv({
      body: { file },
    })
  },

  importHistorical: async (
    file: File,
    dryRun: boolean = true,
    skipUnmatchedConsultants: boolean = false,
    columnMapping?: Record<string, number | null>
  ) => {
    return importHistoricalKti({
      query: { dryRun, skipUnmatchedConsultants },
      body: {
        file,
        columnMapping: columnMapping ? JSON.stringify(columnMapping) : undefined,
      },
    })
  },

  // Assignments
  getAssignments: async (roundId: number) => {
    return getKtiAssignments({ path: { roundId } })
  },

  getAssignment: async (roundId: number, assignmentId: number) => {
    return getKtiAssignment({ path: { roundId, assignmentId } })
  },

  createAssignment: async (roundId: number, data: CreateKtiAssignment) => {
    return createKtiAssignment({ path: { roundId }, body: data })
  },

  deleteAssignment: async (roundId: number, assignmentId: number) => {
    return deleteKtiAssignment({ path: { roundId, assignmentId } })
  },

  // Invitations
  getInvitations: async (roundId: number, status?: KtiInvitationStatus) => {
    return getKtiInvitations({ path: { roundId }, query: { status } })
  },

  sendInvitations: async (roundId: number) => {
    return sendKtiInvitations({ path: { roundId } })
  },

  sendReminders: async (roundId: number) => {
    return sendKtiReminders({ path: { roundId } })
  },

  // Consultants
  getConsultants: async () => {
    return getKtiConsultants()
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

  // KTI Users (for alias mapping)
  getKtiUsers: async () => {
    return getKtiUsers()
  },

  // Statistics
  getRoundStatistics: async (roundId: number) => {
    return getKtiRoundStatistics({ path: { roundId } })
  },

  getRoundResponses: async (roundId: number) => {
    return getKtiRoundResponses({ path: { roundId } })
  },

  getStatisticsByConsultant: async (roundId: number) => {
    return getKtiStatisticsByConsultant({ path: { roundId } })
  },

  // Trend Statistics
  getCompanyTrends: async () => {
    return getKtiCompanyTrends()
  },

  getConsultantsTrends: async () => {
    return getKtiConsultantsTrends()
  },

  // Response Admin Operations
  updateResponse: async (responseId: number, data: UpdateKtiResponse) => {
    return updateKtiResponse({ path: { responseId }, body: data })
  },

  deleteResponse: async (responseId: number) => {
    return deleteKtiResponse({ path: { responseId } })
  },

  // Invitation Admin Operations
  updateInvitation: async (invitationId: number, data: UpdateKtiInvitation) => {
    return updateKtiInvitation({ path: { invitationId }, body: data })
  },

  deleteInvitation: async (invitationId: number) => {
    return deleteKtiInvitation({ path: { invitationId } })
  },

  // My KTI (Consultant's own data)
  getMyStatistics: async () => {
    return getKtiMyStatistics()
  },

  getMyTrends: async () => {
    return getKtiMyTrends()
  },

  getMyResponses: async (roundId?: number) => {
    return getKtiMyResponses({ query: { roundId } })
  },

  // Admin endpoints for viewing any consultant's KTI data
  getConsultantStatisticsAdmin: async (consultantId: number) => {
    return getKtiConsultantStatisticsAdmin({ path: { consultantId } })
  },

  getConsultantTrendsAdmin: async (consultantId: number) => {
    return getKtiConsultantTrendsAdmin({ path: { consultantId } })
  },

  getConsultantResponsesAdmin: async (consultantId: number, roundId?: number) => {
    return getKtiConsultantResponsesAdmin({ path: { consultantId }, query: { roundId } })
  },
}

export default ktiService
