/**
 * KTU Public Survey Service
 *
 * Handles public survey API calls that don't require authentication.
 * Used by survey respondents to view and submit their responses.
 */
// Conditionally import openapi-client only in browser environment
if (typeof window !== 'undefined') {
  import('@/services/openapi-client')
}

import { getPublicSurvey, submitPublicSurveyResponses } from '@/data/types'
import type {
  PublicSurveyData,
  PublicSurveyQuestion,
  SubmitSurveyResponses,
  SurveyResponseItem,
  SurveyAppearance,
} from '@/data/types'

// Re-export types for convenience
export type {
  PublicSurveyData,
  PublicSurveyQuestion,
  SubmitSurveyResponses,
  SurveyResponseItem,
  SurveyAppearance,
}

const ktuPublicService = {
  /**
   * Get survey information and questions for a respondent
   * @param token - Unique survey token from invitation link
   */
  getSurvey: async (token: string) => {
    return getPublicSurvey({ path: { token } })
  },

  /**
   * Submit survey responses
   * @param token - Unique survey token from invitation link
   * @param responses - Array of question responses
   */
  submitResponses: async (token: string, responses: SurveyResponseItem[]) => {
    return submitPublicSurveyResponses({
      path: { token },
      body: { responses },
    })
  },
}

export default ktuPublicService
