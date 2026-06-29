package org.example.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a requested resource is not found in the database.
 * Returns HTTP 404 NOT_FOUND.
 */
public class ResourceNotFoundException extends CustomException {

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String message, String errorCode) {
        super(message, HttpStatus.NOT_FOUND, errorCode);
    }
}
