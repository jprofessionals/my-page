package no.jpro.mypageapi.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody
import java.lang.RuntimeException

@ControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(MyPageRestException::class)
    @ResponseBody
    fun myCustomException(e: MyPageRestException): ResponseEntity<String> {
        val responseEntity = ResponseEntity(e.message, e.httpStatus)
        return responseEntity
    }

    @ExceptionHandler(InvalidUserSubException::class)
    @ResponseBody
    fun myCustomException(e: InvalidUserSubException): ResponseEntity<String> {
        val responseEntity = ResponseEntity(e.message, HttpStatus.FORBIDDEN)
        return responseEntity
    }

    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseBody
    fun myCustomException(e: IllegalArgumentException): ResponseEntity<String> {
        val responseEntity = ResponseEntity(e.message, HttpStatus.BAD_REQUEST)
        return responseEntity
    }

    @ExceptionHandler(IllegalStateException::class)
    @ResponseBody
    fun myCustomException(e: IllegalStateException): ResponseEntity<String> {
        val responseEntity = ResponseEntity(e.message, HttpStatus.CONFLICT)
        return responseEntity
    }

}

class MyPageRestException(val httpStatus: HttpStatus, override val message: String?) : RuntimeException() {}
class InvalidUserSubException(message: String) : RuntimeException(message)