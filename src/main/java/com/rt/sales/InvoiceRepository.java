package com.rt.sales;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    
    // --- LIGHTWEIGHT DASHBOARD QUERY ---
    List<Invoice> findByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // --- PAGINATION QUERY ---
    @Query("SELECT i FROM Invoice i WHERE " +
           "(:search = '' OR LOWER(i.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.customInvoiceId) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(i.orderDate >= :startDate) AND " +
           "(i.orderDate <= :endDate)")
    Page<Invoice> findFilteredInvoices(
            @Param("search") String search, 
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate, 
            Pageable pageable);
}