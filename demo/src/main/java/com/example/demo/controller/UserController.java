package com.example.demo.controller;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.dto.UserQuery;
import org.springframework.web.bind.annotation.*;

/**
 * Covers: class-level base path, @PathVariable (id-like → 1), @RequestHeader,
 * @ModelAttribute → flattened query, @RequestParam (scalar / defaultValue / required=false),
 * @RequestBody (rich nested payload), and every HTTP verb (GET/POST/PUT/DELETE/PATCH).
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    // GET with a path variable + a request header.
    @GetMapping("/{id}")
    public Object getUser(@PathVariable Long id,
                          @RequestHeader("X-Trace-Id") String traceId) {
        return null;
    }

    // GET with @ModelAttribute → query params flattened from UserQuery fields.
    @GetMapping
    public Object listUsers(@ModelAttribute UserQuery query) {
        return null;
    }

    // GET with scalar @RequestParam, a defaultValue, and an optional param.
    @GetMapping("/search")
    public Object searchUsers(@RequestParam String keyword,
                              @RequestParam(defaultValue = "10") int limit,
                              @RequestParam(required = false) String status) {
        return null;
    }

    // POST with a rich @RequestBody → JSON body with nested DTO / List / Map / dates.
    @PostMapping
    public Object createUser(@RequestBody CreateUserRequest request) {
        return null;
    }

    // PUT with a path variable + @RequestBody.
    @PutMapping("/{id}")
    public Object updateUser(@PathVariable Long id,
                             @RequestBody UpdateUserRequest request) {
        return null;
    }

    // DELETE with a path variable.
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
    }

    // PATCH with a path variable + query param.
    @PatchMapping("/{id}/status")
    public Object patchStatus(@PathVariable Long id,
                              @RequestParam String status) {
        return null;
    }
}
