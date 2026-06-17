package com.example.demo.dto;

/** Nested DTO — exercises recursive field expansion inside a @RequestBody. */
public class Address {
    private String street;
    private String city;
    private String zipCode;
    private String country;

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
