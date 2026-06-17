package com.example.demo.controller;

import com.example.demo.dto.CreateOrderRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

/**
 * Covers: List-of-DTO + Map @RequestBody, framework param auto-skip
 * (HttpServletRequest is ignored), multiple @PathVariable in one URL, and a
 * single @RequestMapping that maps to BOTH GET and POST (two ### blocks generated:
 * sync_GET / sync_POST).
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // POST @RequestBody with List<OrderItem> + Map; HttpServletRequest is auto-skipped.
    @PostMapping
    public Object createOrder(@RequestBody CreateOrderRequest request,
                              HttpServletRequest servletRequest) {
        return null;
    }

    // Two path variables in one URL.
    @GetMapping("/{orderId}/items/{itemId}")
    public Object getOrderItem(@PathVariable Long orderId,
                               @PathVariable Long itemId) {
        return null;
    }

    // One method mapped to multiple HTTP verbs.
    @RequestMapping(value = "/sync", method = {RequestMethod.GET, RequestMethod.POST})
    public Object sync(@RequestParam(defaultValue = "false") boolean force) {
        return null;
    }
}
