package org.example.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when attempting to create a resource that already exists.
 * Returns HTTP 409 CONFLICT.
 */
public class DuplicateResourceException extends CustomException {

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT);
    }

    public DuplicateResourceException(String message, String errorCode) {
        super(message, HttpStatus.CONFLICT, errorCode);
    }
}
