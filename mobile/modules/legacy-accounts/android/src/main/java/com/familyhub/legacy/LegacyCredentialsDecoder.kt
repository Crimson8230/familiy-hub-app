package com.familyhub.legacy

import java.io.ByteArrayInputStream
import java.io.DataInputStream
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import android.security.keystore.KeyProperties

data class EncryptedCredentials(val ciphertext: ByteArray, val iv: ByteArray, val formatVersion: Int)
data class RegisterCredentials(val username: String, val password: String) {
    override fun toString(): String = "RegisterCredentials([REDACTED])"
}
class LegacyCredentialsDecoder {
    fun decrypt(encrypted: EncryptedCredentials): RegisterCredentials {
        require(encrypted.formatVersion in 1..CURRENT_FORMAT_VERSION) { "Unsupported credentials format" }
        val plaintext = if (encrypted.formatVersion == 3) {
            require(encrypted.ciphertext.size > WRAPPING_IV_BYTES + WRAPPED_KEY_BYTES) { "Invalid credentials format" }
            val wrappingCipher = Cipher.getInstance(TRANSFORMATION)
            wrappingCipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(
                128, encrypted.ciphertext.copyOfRange(0, WRAPPING_IV_BYTES),
            ))
            val dataKey = wrappingCipher.doFinal(encrypted.ciphertext.copyOfRange(
                WRAPPING_IV_BYTES, WRAPPING_IV_BYTES + WRAPPED_KEY_BYTES,
            ))
            try {
                val payloadCipher = Cipher.getInstance(TRANSFORMATION)
                payloadCipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(dataKey, KeyProperties.KEY_ALGORITHM_AES),
                    GCMParameterSpec(128, encrypted.iv))
                payloadCipher.doFinal(encrypted.ciphertext.copyOfRange(
                    WRAPPING_IV_BYTES + WRAPPED_KEY_BYTES, encrypted.ciphertext.size,
                ))
            } finally {
                dataKey.fill(0)
            }
        } else {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(128, encrypted.iv))
            cipher.doFinal(encrypted.ciphertext)
        }
        return try {
            DataInputStream(ByteArrayInputStream(plaintext)).use { stream ->
                if (encrypted.formatVersion == 1) {
                    RegisterCredentials(stream.readUTF(), stream.readUTF())
                } else {
                    RegisterCredentials(stream.readLengthPrefixed(), stream.readLengthPrefixed())
                }
            }
        } finally {
            plaintext.fill(0)
        }
    }

    private fun DataInputStream.readLengthPrefixed(): String {
        val length = readInt()
        require(length >= 0 && length <= available()) { "Invalid credentials format" }
        val bytes = ByteArray(length)
        return try {
            readFully(bytes)
            bytes.toString(Charsets.UTF_8)
        } finally {
            bytes.fill(0)
        }
    }

    private fun secretKey(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        return store.getKey(KEY_ALIAS, null) as? SecretKey ?: error("Legacy key unavailable")
    }
    private companion object {
        const val KEY_ALIAS = "family_hub_register_credentials_v1"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val CURRENT_FORMAT_VERSION = 3
        const val DATA_KEY_BYTES = 32
        const val WRAPPING_IV_BYTES = 12
        const val WRAPPED_KEY_BYTES = DATA_KEY_BYTES + 16
    }
}
