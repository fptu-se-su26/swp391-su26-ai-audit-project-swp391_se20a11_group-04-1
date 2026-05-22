package org.example.backend.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for controller methods to verify that the current authenticated user
 * is an active member of the project.
 * The method must accept a `projectId` parameter (either @PathVariable or @RequestParam).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface PreAuthorizeProjectMember {
}
