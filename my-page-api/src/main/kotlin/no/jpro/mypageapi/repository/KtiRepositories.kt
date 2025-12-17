package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.kti.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface KtiRoundRepository : JpaRepository<KtiRound, Long> {
    fun findByStatus(status: KtiRoundStatus): List<KtiRound>
    fun findByYear(year: Int): KtiRound?
    fun existsByYear(year: Int): Boolean
}

@Repository
interface KtiOrganizationRepository : JpaRepository<KtiCustomerOrganization, Long> {
    fun findByActive(active: Boolean): List<KtiCustomerOrganization>
    fun findByNameIgnoreCase(name: String): KtiCustomerOrganization?
    fun existsByNameIgnoreCase(name: String): Boolean
}

@Repository
interface KtiContactRepository : JpaRepository<KtiCustomerContact, Long> {
    fun findByOrganizationId(organizationId: Long): List<KtiCustomerContact>
    fun findByOrganizationIdAndActive(organizationId: Long, active: Boolean): List<KtiCustomerContact>
    fun findByActive(active: Boolean): List<KtiCustomerContact>
    fun findByEmailIgnoreCase(email: String): KtiCustomerContact?

    @Query("SELECT c FROM KtiCustomerContact c WHERE c.active = :active AND c.optedOut = false")
    fun findActiveAndNotOptedOut(active: Boolean): List<KtiCustomerContact>
}

@Repository
interface KtiQuestionRepository : JpaRepository<KtiQuestion, Long> {
    fun findByActive(active: Boolean): List<KtiQuestion>
    fun findByActiveOrderByDisplayOrder(active: Boolean): List<KtiQuestion>
    fun findByCode(code: String): KtiQuestion?
    fun findAllByOrderByDisplayOrder(): List<KtiQuestion>
}

@Repository
interface KtiAssignmentRepository : JpaRepository<KtiAssignment, Long> {
    fun findByRoundId(roundId: Long): List<KtiAssignment>
    fun findByConsultantId(consultantId: Long): List<KtiAssignment>
    fun findByRoundIdAndConsultantId(roundId: Long, consultantId: Long): List<KtiAssignment>
    fun existsByRoundIdAndConsultantIdAndContactId(roundId: Long, consultantId: Long, contactId: Long): Boolean
    fun findByRoundIdAndConsultantIdAndContactId(roundId: Long, consultantId: Long, contactId: Long): KtiAssignment?
}

@Repository
interface KtiInvitationRepository : JpaRepository<KtiInvitation, Long> {
    fun findByToken(token: String): KtiInvitation?
    fun findByAssignmentId(assignmentId: Long): List<KtiInvitation>
    fun findByStatus(status: KtiInvitationStatus): List<KtiInvitation>

    @Query("SELECT i FROM KtiInvitation i WHERE i.assignment.round.id = :roundId")
    fun findByRoundId(roundId: Long): List<KtiInvitation>

    @Query("SELECT i FROM KtiInvitation i WHERE i.assignment.round.id = :roundId AND i.status = :status")
    fun findByRoundIdAndStatus(roundId: Long, status: KtiInvitationStatus): List<KtiInvitation>
}

@Repository
interface KtiResponseRepository : JpaRepository<KtiResponse, Long> {
    fun findByInvitationId(invitationId: Long): List<KtiResponse>

    @Query("""
        SELECT r FROM KtiResponse r
        JOIN FETCH r.question
        JOIN FETCH r.invitation i
        JOIN FETCH i.assignment a
        JOIN FETCH a.consultant
        LEFT JOIN FETCH a.contact c
        LEFT JOIN FETCH c.organization
        WHERE a.round.id = :roundId
    """)
    fun findByRoundId(roundId: Long): List<KtiResponse>

    @Query("SELECT r FROM KtiResponse r WHERE r.invitation.assignment.consultant.id = :consultantId")
    fun findByConsultantId(consultantId: Long): List<KtiResponse>

    @Query("SELECT r FROM KtiResponse r WHERE r.invitation.assignment.round.id = :roundId AND r.invitation.assignment.consultant.id = :consultantId")
    fun findByRoundIdAndConsultantId(roundId: Long, consultantId: Long): List<KtiResponse>
}

@Repository
interface KtiConsultantAliasRepository : JpaRepository<KtiConsultantAlias, Long> {
    fun findByAliasNameIgnoreCase(aliasName: String): KtiConsultantAlias?
    fun findByUserId(userId: Long): List<KtiConsultantAlias>
    fun existsByAliasNameIgnoreCase(aliasName: String): Boolean
    fun deleteByAliasNameIgnoreCase(aliasName: String)
}

@Repository
interface KtiRoundQuestionRepository : JpaRepository<KtiRoundQuestion, Long> {
    fun findByRoundIdOrderByDisplayOrder(roundId: Long): List<KtiRoundQuestion>
    fun findByRoundIdAndActiveOrderByDisplayOrder(roundId: Long, active: Boolean): List<KtiRoundQuestion>
    fun findByRoundIdAndQuestionId(roundId: Long, questionId: Long): KtiRoundQuestion?
    fun existsByRoundIdAndQuestionId(roundId: Long, questionId: Long): Boolean
    fun deleteByRoundIdAndQuestionId(roundId: Long, questionId: Long)
}