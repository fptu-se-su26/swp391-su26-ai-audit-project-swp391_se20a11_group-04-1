package org.example.backend.dto;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Generic pagination response DTO.
 * Wraps Spring Data Page into a clean, frontend-friendly structure.
 * Reusable across all modules (Evidence, TestCase, UseCase, etc.)
 */
@Data
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;

    public static <T> PageResponse<T> from(Page<T> springPage) {
        PageResponse<T> response = new PageResponse<>();
        response.setContent(springPage.getContent());
        response.setPage(springPage.getNumber());
        response.setSize(springPage.getSize());
        response.setTotalElements(springPage.getTotalElements());
        response.setTotalPages(springPage.getTotalPages());
        response.setFirst(springPage.isFirst());
        response.setLast(springPage.isLast());
        return response;
    }
}
