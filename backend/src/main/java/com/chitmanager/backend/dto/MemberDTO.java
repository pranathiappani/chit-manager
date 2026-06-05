package com.chitmanager.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MemberDTO {
    private Long id;
    private String name;
    private String phone;
    private String address;
    private String nominee;
    private String guarantor;
    private LocalDate joiningDate;
    private LocalDateTime createdAt;
    private Long chitMemberId;
    private Integer slotIndex;
}
