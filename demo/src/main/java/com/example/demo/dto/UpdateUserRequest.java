package com.example.demo.dto;

/** Simpler @RequestBody used by PUT. */
public class UpdateUserRequest {
    private String email;
    private boolean active;
    private Address address;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
}
