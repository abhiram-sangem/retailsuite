package com.rt.inventory;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findFirstByName(String name);
    List<Product> findByScheduledDateLessThanEqual(LocalDate date);
}