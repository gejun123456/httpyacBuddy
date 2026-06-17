package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Rich @RequestBody payload: scalars, date types, nested DTO, List of strings,
 * List of nested DTOs, and a Map — all recursively filled with type-based defaults.
 */
public class CreateUserRequest {
    private String username;
    private String email;
    private int age;
    private boolean active;
    private BigDecimal balance;
    private LocalDate birthday;
    private Address address;
    private List<String> roles;
    private List<Address> previousAddresses;
    private Map<String, String> attributes;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<Address> getPreviousAddresses() { return previousAddresses; }
    public void setPreviousAddresses(List<Address> previousAddresses) { this.previousAddresses = previousAddresses; }
    public Map<String, String> getAttributes() { return attributes; }
    public void setAttributes(Map<String, String> attributes) { this.attributes = attributes; }
}
