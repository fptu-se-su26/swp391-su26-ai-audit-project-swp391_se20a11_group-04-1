package org.example.backend.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;

/**
 * Base exception class for all custom business exceptions.
 * All specific exceptions should extend this class.
 */
@Getter
public class CustomException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = null;
    }

    public CustomException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
}
