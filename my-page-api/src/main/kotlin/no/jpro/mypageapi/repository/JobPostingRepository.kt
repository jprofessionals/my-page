package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.TechCategory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime

@Repository
interface JobPostingRepository : JpaRepository<JobPosting, Long> {

    fun findByTechCategoryIsNull(): List<JobPosting>

    fun findByTechCategoryIsNotNull(): List<JobPosting>

    @Query("""
        SELECT jp
        FROM JobPosting jp
        JOIN jp.customer c
        LEFT JOIN jp.tags t
        WHERE
            (
                jp.id IN :includeIds
            )
            OR
            (
                (
                    :hidden IS NULL
                    OR
                    jp.hidden = :hidden
                )
                AND
                (
                    :#{#customerNames.isEmpty()} = true
                    OR
                    c.name IN :customerNames
                )
                AND
                (
                    :fromDateTime IS NULL
                    OR
                    jp.urgent = true
                    OR
                    jp.deadline >= :fromDateTime
                )
            )
        GROUP BY jp
        HAVING
            (
                jp.id IN :includeIds
            )
            OR
            (
                :#{#tagNames.isEmpty()} = true
                OR
                COUNT(CASE WHEN t.name IN :tagNames THEN 1 END) = :#{#tagNames.size()}
            )
    """)
    fun findAllWithFilters(
        @Param("customerNames") customerNames: List<String>,
        @Param("fromDateTime") fromDateTime: OffsetDateTime?,
        @Param("hidden") hidden: Boolean?,
        @Param("includeIds") includeIds: List<String>,
        @Param("tagNames") tagNames: List<String>,
    ): List<JobPosting>
}