package org.example.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when the user is authenticated but does not have permission.
 * Returns HTTP 403 FORBIDDEN.
 */
public class ForbiddenException extends CustomException {

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }

    public ForbiddenException(String message, String errorCode) {
        super(message, HttpStatus.FORBIDDEN, errorCode);
    }
}
