package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.ktu.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface KtuColorThemeRepository : JpaRepository<KtuColorTheme, Long> {
    fun findByIsDefault(isDefault: Boolean): KtuColorTheme?
    fun findByName(name: String): KtuColorTheme?
    fun existsByName(name: String): Boolean
}

@Repository
interface KtuRoundRepository : JpaRepository<KtuRound, Long> {
    fun findByStatus(status: KtuRoundStatus): List<KtuRound>
    fun findByYear(year: Int): KtuRound?
    fun existsByYear(year: Int): Boolean
    fun existsByColorThemeId(themeId: Long): Boolean
}

@Repository
interface KtuOrganizationRepository : JpaRepository<KtuCustomerOrganization, Long> {
    fun findByActive(active: Boolean): List<KtuCustomerOrganization>
    fun findByNameIgnoreCase(name: String): KtuCustomerOrganization?
    fun existsByNameIgnoreCase(name: String): Boolean
}

@Repository
interface KtuContactRepository : JpaRepository<KtuCustomerContact, Long> {
    fun findByOrganizationId(organizationId: Long): List<KtuCustomerContact>
    fun findByOrganizationIdAndActive(organizationId: Long, active: Boolean): List<KtuCustomerContact>
    fun findByActive(active: Boolean): List<KtuCustomerContact>
    fun findByEmailIgnoreCase(email: String): KtuCustomerContact?

    @Query("SELECT c FROM KtuCustomerContact c WHERE c.active = :active AND c.optedOut = false")
    fun findActiveAndNotOptedOut(active: Boolean): List<KtuCustomerContact>
}

@Repository
interface KtuQuestionRepository : JpaRepository<KtuQuestion, Long> {
    fun findByActive(active: Boolean): List<KtuQuestion>
    fun findByActiveOrderByDisplayOrder(active: Boolean): List<KtuQuestion>
    fun findByCode(code: String): KtuQuestion?
    fun findAllByOrderByDisplayOrder(): List<KtuQuestion>
}

@Repository
interface KtuAssignmentRepository : JpaRepository<KtuAssignment, Long> {
    fun findByRoundId(roundId: Long): List<KtuAssignment>
    fun findByConsultantId(consultantId: Long): List<KtuAssignment>
    fun findByRoundIdAndConsultantId(roundId: Long, consultantId: Long): List<KtuAssignment>
    fun existsByRoundIdAndConsultantIdAndContactId(roundId: Long, consultantId: Long, contactId: Long): Boolean
    fun findByRoundIdAndConsultantIdAndContactId(roundId: Long, consultantId: Long, contactId: Long): KtuAssignment?
}

@Repository
interface KtuInvitationRepository : JpaRepository<KtuInvitation, Long> {
    fun findByToken(token: String): KtuInvitation?
    fun findByAssignmentId(assignmentId: Long): List<KtuInvitation>
    fun findByStatus(status: KtuInvitationStatus): List<KtuInvitation>

    @Query("SELECT i FROM KtuInvitation i WHERE i.assignment.round.id = :roundId")
    fun findByRoundId(roundId: Long): List<KtuInvitation>

    @Query("SELECT i FROM KtuInvitation i WHERE i.assignment.round.id = :roundId AND i.status = :status")
    fun findByRoundIdAndStatus(roundId: Long, status: KtuInvitationStatus): List<KtuInvitation>
}

@Repository
interface KtuResponseRepository : JpaRepository<KtuResponse, Long> {
    fun findByInvitationId(invitationId: Long): List<KtuResponse>

    @Query("""
        SELECT r FROM KtuResponse r
        JOIN FETCH r.question
        JOIN FETCH r.invitation i
        JOIN FETCH i.assignment a
        JOIN FETCH a.consultant
        LEFT JOIN FETCH a.contact c
        LEFT JOIN FETCH c.organization
        WHERE a.round.id = :roundId
    """)
    fun findByRoundId(roundId: Long): List<KtuResponse>

    @Query("SELECT r FROM KtuResponse r WHERE r.invitation.assignment.consultant.id = :consultantId")
    fun findByConsultantId(consultantId: Long): List<KtuResponse>

    @Query("SELECT r FROM KtuResponse r WHERE r.invitation.assignment.round.id = :roundId AND r.invitation.assignment.consultant.id = :consultantId")
    fun findByRoundIdAndConsultantId(roundId: Long, consultantId: Long): List<KtuResponse>
}

@Repository
interface KtuConsultantAliasRepository : JpaRepository<KtuConsultantAlias, Long> {
    fun findByAliasNameIgnoreCase(aliasName: String): KtuConsultantAlias?
    fun findByUserId(userId: Long): List<KtuConsultantAlias>
    fun existsByAliasNameIgnoreCase(aliasName: String): Boolean
    fun deleteByAliasNameIgnoreCase(aliasName: String)
}

@Repository
interface KtuRoundQuestionRepository : JpaRepository<KtuRoundQuestion, Long> {
    fun findByRoundIdOrderByDisplayOrder(roundId: Long): List<KtuRoundQuestion>
    fun findByRoundIdAndActiveOrderByDisplayOrder(roundId: Long, active: Boolean): List<KtuRoundQuestion>
    fun findByRoundIdAndQuestionId(roundId: Long, questionId: Long): KtuRoundQuestion?
    fun existsByRoundIdAndQuestionId(roundId: Long, questionId: Long): Boolean
    fun deleteByRoundIdAndQuestionId(roundId: Long, questionId: Long)
}