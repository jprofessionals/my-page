package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

data class UserSyncResult(
    val totalFromFlowcase: Int,
    val created: Int,
    val updated: Int,
    val skipped: Int,
    val errors: List<String>
)

/**
 * Helper component for saving users in separate transactions.
 * This ensures that one failed save doesn't affect others.
 */
@Component
class UserSaveHelper(private val userRepository: UserRepository) {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun saveUser(user: User): User {
        return userRepository.save(user)
    }
}

@Service
class UserSyncService(
    private val flowcaseService: FlowcaseService,
    private val userRepository: UserRepository,
    private val userSaveHelper: UserSaveHelper
) {
    private val logger = LoggerFactory.getLogger(UserSyncService::class.java)

    /**
     * Sync users from Flowcase to the local database.
     * - Creates new users if they don't exist (matched by email, case-insensitive)
     * - Updates existing users if name has changed
     * - Skips users that are already up to date
     */
    fun syncFromFlowcase(): UserSyncResult {
        val errors = mutableListOf<String>()
        var created = 0
        var updated = 0
        var skipped = 0

        // Fetch all Flowcase users
        val flowcaseUsers = try {
            flowcaseService.getConsultants()
        } catch (e: Exception) {
            logger.error("Failed to fetch users from Flowcase", e)
            return UserSyncResult(
                totalFromFlowcase = 0,
                created = 0,
                updated = 0,
                skipped = 0,
                errors = listOf("Kunne ikke hente brukere fra Flowcase: ${e.message}")
            )
        }

        logger.info("Syncing ${flowcaseUsers.size} users from Flowcase")

        // Pre-fetch all existing users and create a case-insensitive email map
        val existingUsers = userRepository.findAll()
        val usersByEmail = existingUsers.associateBy { it.email?.lowercase() }

        for (flowcaseUser in flowcaseUsers) {
            val email = flowcaseUser.email
            val name = flowcaseUser.name

            if (email.isNullOrBlank()) {
                errors.add("Bruker uten e-post hoppet over: ${name ?: "ukjent"}")
                continue
            }

            if (name.isNullOrBlank()) {
                errors.add("Bruker uten navn hoppet over: $email")
                continue
            }

            try {
                // Find existing user by email (case-insensitive)
                val existingUser = usersByEmail[email.lowercase()]

                // Truncate icon URL if too long (database column limit)
                val safeIcon = flowcaseUser.imageUrl?.take(250)

                // Don't overwrite Google profile pictures with CVPartner URLs
                val hasGooglePicture = existingUser?.icon?.contains("googleusercontent.com") == true

                if (existingUser != null) {
                    // Check if update is needed
                    if (existingUser.name != name) {
                        val updatedUser = existingUser.copy(
                            name = name,
                            icon = if (hasGooglePicture) existingUser.icon else (safeIcon ?: existingUser.icon)
                        )
                        userSaveHelper.saveUser(updatedUser)
                        updated++
                        logger.debug("Updated user: $email (name: $name)")
                    } else {
                        skipped++
                    }
                } else {
                    // Create new user
                    val nameParts = name.split(" ", limit = 2)
                    val givenName = nameParts.getOrNull(0)
                    val familyName = if (nameParts.size > 1) nameParts[1] else null

                    val newUser = User(
                        email = email,
                        name = name,
                        givenName = givenName,
                        familyName = familyName,
                        icon = safeIcon,
                        budgets = emptyList(),
                        enabled = true
                    )
                    userSaveHelper.saveUser(newUser)
                    created++
                    logger.info("Created new user: $email (name: $name)")
                }
            } catch (e: Exception) {
                val errorMsg = "Feil ved synkronisering av bruker $email: ${e.message}"
                logger.error(errorMsg, e)
                errors.add(errorMsg)
            }
        }

        logger.info("Flowcase sync completed: created=$created, updated=$updated, skipped=$skipped, errors=${errors.size}")

        return UserSyncResult(
            totalFromFlowcase = flowcaseUsers.size,
            created = created,
            updated = updated,
            skipped = skipped,
            errors = errors
        )
    }
}
