package com.example.demo.dto;

import java.time.LocalDate;

/**
 * Bound with @ModelAttribute on a GET → flattened into URL query parameters
 * (name=...&page=...&size=...&sort=...&createdAfter=...).
 */
public class UserQuery {
    private String name;
    private int page;
    private int size;
    private String sort;
    private LocalDate createdAfter;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
    public String getSort() { return sort; }
    public void setSort(String sort) { this.sort = sort; }
    public LocalDate getCreatedAfter() { return createdAfter; }
    public void setCreatedAfter(LocalDate createdAfter) { this.createdAfter = createdAfter; }
}
