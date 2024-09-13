package no.jpro.mypageapi.service

import java.io.InputStream

interface ImageService {
    fun getImage(fileName: String): InputStream
}
