package org.example.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when authentication is required but not provided or invalid.
 * Returns HTTP 401 UNAUTHORIZED.
 */
public class UnauthorizedException extends CustomException {

    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }

    public UnauthorizedException(String message, String errorCode) {
        super(message, HttpStatus.UNAUTHORIZED, errorCode);
    }
}
