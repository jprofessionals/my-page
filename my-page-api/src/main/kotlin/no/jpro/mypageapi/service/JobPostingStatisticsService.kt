package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.TechCategory
import no.jpro.mypageapi.repository.JobPostingRepository
import org.springframework.stereotype.Service
import java.time.YearMonth
import java.time.format.DateTimeFormatter

data class MonthlyStatistics(
    val month: String,
    val javaKotlin: Int,
    val dotnet: Int,
    val dataAnalytics: Int,
    val frontend: Int,
    val other: Int
)

data class JobPostingStatisticsResult(
    val monthlyData: List<MonthlyStatistics>,
    val uncategorizedCount: Int
)

@Service
class JobPostingStatisticsService(
    private val jobPostingRepository: JobPostingRepository
) {
    private val monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM")

    fun getStatistics(): JobPostingStatisticsResult {
        val allJobPostings = jobPostingRepository.findAll()
        val uncategorizedCount = allJobPostings.count { it.techCategory == null }

        // Group by month and category
        val monthlyStats = allJobPostings
            .filter { it.createdDate != null && it.techCategory != null }
            .groupBy { YearMonth.from(it.createdDate) }
            .mapValues { (_, postings) ->
                postings.groupBy { it.techCategory }
                    .mapValues { it.value.size }
            }
            .entries
            .sortedBy { it.key }
            .map { (month, categoryCounts) ->
                MonthlyStatistics(
                    month = month.format(monthFormatter),
                    javaKotlin = categoryCounts[TechCategory.JAVA_KOTLIN] ?: 0,
                    dotnet = categoryCounts[TechCategory.DOTNET] ?: 0,
                    dataAnalytics = categoryCounts[TechCategory.DATA_ANALYTICS] ?: 0,
                    frontend = categoryCounts[TechCategory.FRONTEND] ?: 0,
                    other = categoryCounts[TechCategory.OTHER] ?: 0
                )
            }

        return JobPostingStatisticsResult(
            monthlyData = monthlyStats,
            uncategorizedCount = uncategorizedCount
        )
    }

    fun getJobPostingsByCategory(category: TechCategory, month: String): List<JobPosting> {
        val yearMonth = YearMonth.parse(month, monthFormatter)

        return jobPostingRepository.findAll()
            .filter { posting ->
                posting.techCategory == category &&
                posting.createdDate != null &&
                YearMonth.from(posting.createdDate) == yearMonth
            }
            .sortedByDescending { it.createdDate }
    }
}
