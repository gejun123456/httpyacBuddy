package com.example.demo.dto;

/** Nested object inside ProductSearch — flattened as page.number / page.size in the query string. */
public class PageRequest {
    private int number;
    private int size;

    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
}
