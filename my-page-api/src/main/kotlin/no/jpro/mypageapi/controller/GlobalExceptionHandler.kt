package no.jpro.mypageapi.controller
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody

@ControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(MyPageRestException::class)
    @ResponseBody
    fun myCustomException(e: MyPageRestException): ResponseEntity<String> {
        logger.error("MyPageRestException: ${e.message}", e)
        val responseEntity = ResponseEntity(e.message, e.httpStatus)
        return responseEntity
    }

    @ExceptionHandler(InvalidUserSubException::class)
    @ResponseBody
    fun myCustomException(e: InvalidUserSubException): ResponseEntity<String> {
        logger.error("InvalidUserSubException: ${e.message}", e)
        val responseEntity = ResponseEntity(e.message, HttpStatus.FORBIDDEN)
        return responseEntity
    }

    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseBody
    fun myCustomException(e: IllegalArgumentException): ResponseEntity<String> {
        logger.error("IllegalArgumentException: ${e.message}", e)
        val responseEntity = ResponseEntity(e.message, HttpStatus.BAD_REQUEST)
        return responseEntity
    }

    @ExceptionHandler(IllegalStateException::class)
    @ResponseBody
    fun myCustomException(e: IllegalStateException): ResponseEntity<String> {
        logger.error("IllegalStateException (HTTP 409): ${e.message}", e)
        val responseEntity = ResponseEntity(e.message, HttpStatus.CONFLICT)
        return responseEntity
    }

    @ExceptionHandler(UserNotFoundException::class)
    @ResponseBody
    fun myCustomException(e: UserNotFoundException): ResponseEntity<String> {
        logger.error("UserNotFoundException: ${e.message}", e)
        val responseEntity = ResponseEntity(e.message, HttpStatus.NOT_FOUND)
        return responseEntity
    }

    @ExceptionHandler(Exception::class)
    @ResponseBody
    fun handleGenericException(e: Exception): ResponseEntity<String> {
        logger.error("Unhandled exception: ${e.message}", e)
        val responseEntity = ResponseEntity("Internal server error: ${e.message}", HttpStatus.INTERNAL_SERVER_ERROR)
        return responseEntity
    }

}

class MyPageRestException(val httpStatus: HttpStatus, override val message: String?) : RuntimeException() {}
class InvalidUserSubException(message: String) : RuntimeException(message)
class UserNotFoundException(message: String) : RuntimeException(message)
