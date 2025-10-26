package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface CabinDrawingRepository : JpaRepository<CabinDrawing, UUID> {
    fun findBySeasonOrderByCreatedAtDesc(season: String): List<CabinDrawing>
    fun findByStatusOrderByCreatedAtDesc(status: DrawingStatus): List<CabinDrawing>
    fun findTopByOrderByCreatedAtDesc(): CabinDrawing?
    fun findTopByStatusNotOrderByCreatedAtDesc(status: DrawingStatus): CabinDrawing?
}

@Repository
interface CabinPeriodRepository : JpaRepository<CabinPeriod, UUID> {
    fun findByDrawingOrderBySortOrder(drawing: CabinDrawing): List<CabinPeriod>
    fun findByDrawingIdOrderBySortOrder(drawingId: UUID): List<CabinPeriod>
}

@Repository
interface CabinWishRepository : JpaRepository<CabinWish, UUID> {
    fun findByDrawingAndUserOrderByPriority(drawing: CabinDrawing, user: User): List<CabinWish>
    fun findByDrawingOrderByPriority(drawing: CabinDrawing): List<CabinWish>
    fun findByDrawingIdAndUserIdOrderByPriority(drawingId: UUID, userId: Long): List<CabinWish>
    fun deleteByDrawingAndUser(drawing: CabinDrawing, user: User)

    @Query("SELECT DISTINCT w.user FROM CabinWish w WHERE w.drawing = :drawing")
    fun findDistinctUsersByDrawing(drawing: CabinDrawing): List<User>
}

@Repository
interface CabinAllocationRepository : JpaRepository<CabinAllocation, UUID> {
    @Query("SELECT a FROM CabinAllocation a WHERE a.drawing = :drawing ORDER BY a.period.startDate ASC, a.apartment.cabin_name ASC")
    fun findByDrawingOrderByPeriodStartDateAscApartmentCabinNameAsc(drawing: CabinDrawing): List<CabinAllocation>

    @Query("SELECT a FROM CabinAllocation a WHERE a.execution = :execution ORDER BY a.period.startDate ASC, a.apartment.cabin_name ASC")
    fun findByExecutionOrderByPeriodStartDateAscApartmentCabinNameAsc(execution: CabinDrawingExecution): List<CabinAllocation>

    fun findByDrawingIdOrderByPeriodStartDateAsc(drawingId: UUID): List<CabinAllocation>
    fun findByDrawingAndUser(drawing: CabinDrawing, user: User): List<CabinAllocation>
    fun deleteByDrawing(drawing: CabinDrawing)

    @Query("SELECT COUNT(a) FROM CabinAllocation a WHERE a.drawing = :drawing AND a.user = :user")
    fun countByDrawingAndUser(drawing: CabinDrawing, user: User): Int

    fun countByExecution(execution: CabinDrawingExecution): Int
}

@Repository
interface CabinDrawingExecutionRepository : JpaRepository<CabinDrawingExecution, UUID> {
    fun findByDrawingOrderByExecutedAtDesc(drawing: CabinDrawing): List<CabinDrawingExecution>
    fun findByDrawingIdOrderByExecutedAtDesc(drawingId: UUID): List<CabinDrawingExecution>
    fun findByDrawingAndId(drawing: CabinDrawing, id: UUID): CabinDrawingExecution?
}
