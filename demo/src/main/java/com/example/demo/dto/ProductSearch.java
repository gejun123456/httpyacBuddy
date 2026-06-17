package com.example.demo.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * @ModelAttribute on a GET with a nested object and a list →
 * keyword=...&priceMin=...&priceMax=...&tags[0]=...&page.number=...&page.size=...
 */
public class ProductSearch {
    private String keyword;
    private BigDecimal priceMin;
    private BigDecimal priceMax;
    private List<String> tags;
    private PageRequest page;

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public BigDecimal getPriceMin() { return priceMin; }
    public void setPriceMin(BigDecimal priceMin) { this.priceMin = priceMin; }
    public BigDecimal getPriceMax() { return priceMax; }
    public void setPriceMax(BigDecimal priceMax) { this.priceMax = priceMax; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public PageRequest getPage() { return page; }
    public void setPage(PageRequest page) { this.page = page; }
}
