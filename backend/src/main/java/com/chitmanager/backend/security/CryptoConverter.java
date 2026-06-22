package com.chitmanager.backend.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

@Converter
public class CryptoConverter implements AttributeConverter<String, String> {

    private static SecretKeySpec secretKey;

    private static SecretKeySpec getSecretKey() {
        if (secretKey == null) {
            String key = System.getProperty("DB_ENCRYPTION_KEY");
            if (key == null || key.isEmpty()) {
                key = System.getenv("DB_ENCRYPTION_KEY");
            }
            if (key == null || key.isEmpty()) {
                key = "default-fallback-key-32-chars-long"; // Development fallback
            }
            try {
                byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
                MessageDigest sha = MessageDigest.getInstance("SHA-256");
                keyBytes = sha.digest(keyBytes);
                secretKey = new SecretKeySpec(keyBytes, "AES");
            } catch (Exception e) {
                throw new RuntimeException("Error initializing encryption key", e);
            }
        }
        return secretKey;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey());
            return Base64.getEncoder().encodeToString(cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting attribute: " + e.getMessage(), e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey());
            return new String(cipher.doFinal(Base64.getDecoder().decode(dbData)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Backwards compatibility: return raw legacy data if decryption fails
            return dbData;
        }
    }
}
