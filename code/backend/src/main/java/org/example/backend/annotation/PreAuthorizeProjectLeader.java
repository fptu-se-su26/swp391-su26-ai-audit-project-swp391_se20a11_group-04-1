package org.example.backend.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for controller methods to verify that the current authenticated user
 * is an active LEADER of the project.
 * The method must accept a `projectId` parameter (either @PathVariable or @RequestParam).
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface PreAuthorizeProjectLeader {
}
