package com.chitmanager.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PayoutPlanDTO {
    private Integer monthNumber;
    private BigDecimal payoutAmount;
    private Integer expectedPayoutCount;
}
