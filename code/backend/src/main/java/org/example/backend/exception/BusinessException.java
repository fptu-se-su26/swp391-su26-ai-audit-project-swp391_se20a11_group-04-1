package org.example.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a business rule is violated.
 * Use this for domain-specific errors that don't fit other exception types.
 * Returns HTTP 422 UNPROCESSABLE_ENTITY.
 */
public class BusinessException extends CustomException {

    public BusinessException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public BusinessException(String message, String errorCode) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode);
    }
}
