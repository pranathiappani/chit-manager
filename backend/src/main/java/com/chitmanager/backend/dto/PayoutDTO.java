package com.chitmanager.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PayoutDTO {
    private Long id;
    private Long chitGroupId;
    private Long memberId;
    private String memberName;
    private Integer payoutMonth;
    private BigDecimal payoutAmount;
    private BigDecimal profitAmount;
    private LocalDate payoutDate;
    private String remarks;
}
