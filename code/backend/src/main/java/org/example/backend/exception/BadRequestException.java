package org.example.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when the client sends an invalid or malformed request.
 * Returns HTTP 400 BAD_REQUEST.
 */
public class BadRequestException extends CustomException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }

    public BadRequestException(String message, String errorCode) {
        super(message, HttpStatus.BAD_REQUEST, errorCode);
    }
}
