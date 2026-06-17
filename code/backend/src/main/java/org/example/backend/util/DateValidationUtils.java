package org.example.backend.util;

import org.example.backend.exception.BadRequestException;

import java.time.LocalDate;

public class DateValidationUtils {

    /**
     * Validates that start date is on or before the end date.
     */
    public static void validateDateRange(LocalDate start, LocalDate end, String entityName) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new BadRequestException(entityName + " start date cannot be after deadline/end date.");
        }
    }

    /**
     * Validates that the child's date range is within the parent's date range.
     */
    public static void validateBounds(LocalDate childStart, LocalDate childEnd,
                                      LocalDate parentStart, LocalDate parentEnd,
                                      String childName, String parentName) {
        if (childStart != null && parentStart != null && childStart.isBefore(parentStart)) {
            throw new BadRequestException(childName + " start date cannot be earlier than " + parentName + " start date (" + parentStart + ").");
        }
        if (childEnd != null && parentEnd != null && childEnd.isAfter(parentEnd)) {
            throw new BadRequestException(childName + " deadline/end date cannot be later than " + parentName + " deadline/end date (" + parentEnd + ").");
        }
    }
}
