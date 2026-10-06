package com.rt.inventory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.rt.history.InventoryHistory;
import com.rt.history.InventoryHistoryRepository;
import com.rt.inventory.dto.CreateProductRequest;
import com.rt.inventory.dto.ProductResponse;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryHistoryRepository inventoryHistoryRepository;

    @InjectMocks
    private ProductService productService;

    @BeforeEach
    void setUp() {
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(10L);
            return product;
        });
    }

    @Test
    void createProduct_shouldDefaultMrpAndLogInventoryEntry() {
        CreateProductRequest request = new CreateProductRequest(
                "Rice",
                "1001",
                120.0,
                null,
                150.0,
                25.0,
                0,
                0.0,
                0.0,
                0.0,
                "");

        ProductResponse response = productService.createProduct(request);

        assertEquals("Rice", response.name());
        assertEquals(150.0, response.mrp());
        verify(inventoryHistoryRepository).save(any(InventoryHistory.class));
    }
}
