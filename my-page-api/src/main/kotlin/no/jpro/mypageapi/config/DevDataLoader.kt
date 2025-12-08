package no.jpro.mypageapi.config

import no.jpro.mypageapi.entity.AvailabilityStatus
import no.jpro.mypageapi.entity.ConsultantAvailability
import no.jpro.mypageapi.entity.Customer
import no.jpro.mypageapi.entity.SalesActivity
import no.jpro.mypageapi.entity.SalesStage
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ConsultantAvailabilityRepository
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.SalesActivityRepository
import no.jpro.mypageapi.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Loads test data for local development.
 * Active when running with 'h2' or 'local' profile.
 */
@Configuration
@Profile("h2", "local")
class DevDataLoader {

    private val logger = LoggerFactory.getLogger(DevDataLoader::class.java)

    @Bean
    fun loadTestData(
        userRepository: UserRepository,
        customerRepository: CustomerRepository,
        salesActivityRepository: SalesActivityRepository,
        consultantAvailabilityRepository: ConsultantAvailabilityRepository
    ): CommandLineRunner {
        return CommandLineRunner {
            // Only load if database is empty (avoid duplicates on restart with local profile)
            if (userRepository.count() > 0) {
                logger.info("Database already has users, skipping test data loading")
                return@CommandLineRunner
            }

            logger.info("Loading test data for development...")

            // === USERS ===
            val testUsers = listOf(
                User(
                    id = null,
                    sub = "test-sub-1",
                    email = "steinar@jpro.no",
                    name = "Steinar Hansen",
                    givenName = "Steinar",
                    familyName = "Hansen",
                    admin = true,
                    budgets = emptyList()
                ),
                User(
                    id = null,
                    sub = "test-sub-2",
                    email = "ola@jpro.no",
                    name = "Ola Nordmann",
                    givenName = "Ola",
                    familyName = "Nordmann",
                    admin = false,
                    budgets = emptyList()
                ),
                User(
                    id = null,
                    sub = "test-sub-3",
                    email = "kari@jpro.no",
                    name = "Kari Hansen",
                    givenName = "Kari",
                    familyName = "Hansen",
                    admin = false,
                    budgets = emptyList()
                ),
                User(
                    id = null,
                    sub = "test-sub-4",
                    email = "per@jpro.no",
                    name = "Per Olsen",
                    givenName = "Per",
                    familyName = "Olsen",
                    admin = false,
                    budgets = emptyList()
                ),
                User(
                    id = null,
                    sub = "test-sub-5",
                    email = "anne@jpro.no",
                    name = "Anne Johansen",
                    givenName = "Anne",
                    familyName = "Johansen",
                    admin = false,
                    budgets = emptyList()
                )
            )

            val savedUsers = testUsers.map { userRepository.save(it) }
            savedUsers.forEach { logger.info("Created test user: ${it.name} (admin=${it.admin})") }

            val steinar = savedUsers[0]
            val ola = savedUsers[1]
            val kari = savedUsers[2]
            val per = savedUsers[3]
            val anne = savedUsers[4]

            // === CUSTOMERS ===
            val testCustomers = listOf(
                Customer(name = "Equinor"),
                Customer(name = "DNB"),
                Customer(name = "Telenor"),
                Customer(name = "Vipps"),
                Customer(name = "NAV"),
                Customer(name = "Skatteetaten")
            )

            val savedCustomers = testCustomers.map { customerRepository.save(it) }
            savedCustomers.forEach { logger.info("Created test customer: ${it.name}") }

            val equinor = savedCustomers[0]
            val dnb = savedCustomers[1]
            val telenor = savedCustomers[2]
            val vipps = savedCustomers[3]
            val nav = savedCustomers[4]

            // === CONSULTANT AVAILABILITY ===
            val availabilities = listOf(
                ConsultantAvailability(
                    consultant = ola,
                    status = AvailabilityStatus.AVAILABLE,
                    updatedBy = steinar
                ),
                ConsultantAvailability(
                    consultant = kari,
                    status = AvailabilityStatus.AVAILABLE_SOON,
                    availableFrom = LocalDate.now().plusWeeks(2),
                    currentCustomer = equinor,
                    updatedBy = steinar
                ),
                ConsultantAvailability(
                    consultant = per,
                    status = AvailabilityStatus.OCCUPIED,
                    currentCustomer = dnb,
                    updatedBy = steinar
                ),
                ConsultantAvailability(
                    consultant = anne,
                    status = AvailabilityStatus.AVAILABLE,
                    updatedBy = steinar
                )
            )

            availabilities.forEach { consultantAvailabilityRepository.save(it) }
            logger.info("Created ${availabilities.size} consultant availability records")

            // === SALES ACTIVITIES ===
            val now = LocalDateTime.now()
            val salesActivities = listOf(
                // Ola - ledig, flere prosesser i ulike steg
                SalesActivity(
                    consultant = ola,
                    customer = vipps,
                    title = "Backend-utvikler til betalingsplattform",
                    currentStage = SalesStage.SENT_TO_CUSTOMER,
                    createdAt = now.minusDays(14),
                    updatedAt = now.minusDays(2),
                    createdBy = steinar
                ),
                SalesActivity(
                    consultant = ola,
                    customer = nav,
                    title = "Kotlin-utvikler til modernisering",
                    currentStage = SalesStage.INTERESTED,
                    createdAt = now.minusDays(7),
                    updatedAt = now.minusDays(3),
                    createdBy = steinar
                ),

                // Kari - blir ledig snart, aktiv i salgsprosess
                SalesActivity(
                    consultant = kari,
                    customer = telenor,
                    title = "Fullstack-utvikler til kundeportal",
                    currentStage = SalesStage.SENT_TO_SUPPLIER,
                    createdAt = now.minusDays(10),
                    updatedAt = now.minusDays(1),
                    createdBy = steinar
                ),
                SalesActivity(
                    consultant = kari,
                    customer = dnb,
                    title = "React-utvikler til nettbank",
                    currentStage = SalesStage.INTERESTED,
                    createdAt = now.minusDays(3),
                    updatedAt = now.minusDays(1),
                    createdBy = steinar
                ),

                // Per - opptatt, men vi selger ham allerede
                SalesActivity(
                    consultant = per,
                    customer = equinor,
                    title = "Java-arkitekt til energiplattform",
                    currentStage = SalesStage.SENT_TO_SUPPLIER,
                    expectedStartDate = LocalDate.now().plusMonths(2),
                    createdAt = now.minusDays(21),
                    updatedAt = now.minusDays(5),
                    createdBy = steinar
                ),

                // Anne - ledig, tidlig i prosessen
                SalesActivity(
                    consultant = anne,
                    customer = vipps,
                    title = "Frontend-utvikler til mobilapp",
                    currentStage = SalesStage.INTERESTED,
                    createdAt = now.minusDays(2),
                    updatedAt = now.minusDays(1),
                    createdBy = steinar
                ),
                SalesActivity(
                    consultant = anne,
                    customer = nav,
                    title = "UX/UI-utvikler",
                    currentStage = SalesStage.INTERESTED,
                    createdAt = now.minusDays(5),
                    updatedAt = now.minusDays(2),
                    createdBy = steinar
                )
            )

            salesActivities.forEach { salesActivityRepository.save(it) }
            logger.info("Created ${salesActivities.size} sales activities")

            logger.info("=== Test data loading complete ===")
            logger.info("User ID 1 (${steinar.name}) is admin - use this for testing")
        }
    }
}
