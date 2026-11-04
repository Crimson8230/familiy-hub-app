package com.familyhub.app.security

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

data class EncryptedCredentials(
    val ciphertext: ByteArray,
    val iv: ByteArray,
    val formatVersion: Int = 1,
)

data class RegisterCredentials(val username: String, val password: String) {
    override fun toString(): String = "RegisterCredentials([REDACTED])"
}

interface CredentialsCipher {
    fun encrypt(username: String, password: String): EncryptedCredentials
    fun decrypt(encrypted: EncryptedCredentials): RegisterCredentials
}

class KeystoreCredentialsCipher : CredentialsCipher {
    override fun encrypt(username: String, password: String): EncryptedCredentials {
        val plaintext = ByteArrayOutputStream().use { output ->
            DataOutputStream(output).use { stream ->
                stream.writeLengthPrefixed(username)
                stream.writeLengthPrefixed(password)
            }
            output.toByteArray()
        }
        return try {
            val dataKey = ByteArray(DATA_KEY_BYTES).also { SecureRandom().nextBytes(it) }
            try {
                val payloadCipher = Cipher.getInstance(TRANSFORMATION)
                payloadCipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(dataKey, KeyProperties.KEY_ALGORITHM_AES))
                val payload = payloadCipher.doFinal(plaintext)
                val wrappingCipher = Cipher.getInstance(TRANSFORMATION)
                wrappingCipher.init(Cipher.ENCRYPT_MODE, secretKey())
                val wrappedKey = wrappingCipher.doFinal(dataKey)
                val combined = wrappingCipher.iv + wrappedKey + payload
                EncryptedCredentials(combined, payloadCipher.iv.copyOf(), CURRENT_FORMAT_VERSION)
            } finally {
                dataKey.fill(0)
            }
        } finally {
            plaintext.fill(0)
        }
    }

    override fun decrypt(encrypted: EncryptedCredentials): RegisterCredentials {
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

    private fun DataOutputStream.writeLengthPrefixed(value: String) {
        val bytes = value.toByteArray(Charsets.UTF_8)
        try {
            writeInt(bytes.size)
            write(bytes)
        } finally {
            bytes.fill(0)
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

    private fun secretKey(): SecretKey = synchronized(KEY_LOCK) {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(KEY_ALIAS, null) as? SecretKey) ?: KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore",
        ).run {
            init(
                KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setRandomizedEncryptionRequired(true)
                    .build(),
            )
            generateKey()
        }
    }

    private companion object {
        const val KEY_ALIAS = "family_hub_register_credentials_v1"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val CURRENT_FORMAT_VERSION = 3
        const val DATA_KEY_BYTES = 32
        const val WRAPPING_IV_BYTES = 12
        const val WRAPPED_KEY_BYTES = DATA_KEY_BYTES + 16
        val KEY_LOCK = Any()
    }
}
