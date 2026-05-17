package org.example.backend.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {
    private final HttpStatus status;

    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public static class BadRequestException extends CustomException {
        public BadRequestException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }

    public static class ResourceNotFoundException extends CustomException {
        public ResourceNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class ConflictException extends CustomException {
        public ConflictException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }
}
