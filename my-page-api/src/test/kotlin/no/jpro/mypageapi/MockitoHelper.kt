package no.jpro.mypageapi

import org.mockito.Mockito.any

object MockitoHelper {
    fun <T> anyObject(): T {
        any<T>()
        return uninitialized()
    }
    @Suppress("UNCHECKED_CAST")
    fun <T> uninitialized(): T =  null as T
}
