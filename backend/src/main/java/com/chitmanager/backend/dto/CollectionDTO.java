package com.chitmanager.backend.dto;

import com.chitmanager.backend.models.CollectionStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CollectionDTO {
    private Long id;
    private Long chitGroupId;
    private Long memberId;
    private String memberName;
    private Integer forMonth;
    private BigDecimal amountPaid;
    private CollectionStatus status;
    private LocalDate paymentDate;
    private String remarks;
}
