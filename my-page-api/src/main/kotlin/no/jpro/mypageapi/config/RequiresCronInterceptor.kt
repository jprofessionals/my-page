package no.jpro.mypageapi.config

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import no.jpro.mypageapi.controller.MyPageRestException
import org.springframework.core.annotation.AnnotatedElementUtils
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.method.HandlerMethod
import org.springframework.web.servlet.HandlerInterceptor

@Component
class RequiresCronInterceptor : HandlerInterceptor {

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        if (handler is HandlerMethod) {
            val method = handler.method
            val declaringClass = handler.beanType

            val hasAnnotation = AnnotatedElementUtils.hasAnnotation(method, RequiresCron::class.java)
                    || AnnotatedElementUtils.hasAnnotation(declaringClass, RequiresCron::class.java)

            if (hasAnnotation) {
                val cronHeader = request.getHeader("X-Appengine-Cron")
                if (cronHeader != "true") {
                    throw MyPageRestException(HttpStatus.FORBIDDEN, "Access denied. This endpoint can only be called by App Engine Cron.")
                }
            }
        }
        return true
    }
}
