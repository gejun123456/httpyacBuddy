package com.example.demo.controller;

import com.example.demo.dto.ProductSearch;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Covers: @ModelAttribute with a NESTED object + list (page.number / tags[0] flattening),
 * an UNANNOTATED complex parameter (treated as expanded query object), and
 * MultipartFile auto-skip on an upload endpoint.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    // @ModelAttribute with nested object + list → flattened query string.
    @GetMapping("/search")
    public Object search(@ModelAttribute ProductSearch search) {
        return null;
    }

    // Unannotated complex parameter is still expanded into query params.
    @GetMapping("/advanced-search")
    public Object advancedSearch(ProductSearch search) {
        return null;
    }

    // MultipartFile is a framework type → skipped; only @RequestParam description remains.
    @PostMapping("/{sku}/image")
    public Object uploadImage(@PathVariable String sku,
                              @RequestParam String description,
                              @RequestParam MultipartFile file) {
        return null;
    }
}
