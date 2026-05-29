package com.chitmanager.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class MemberDetailsDTO {
    private MemberDTO member;
    private List<ChitGroupDTO> chits;
    private List<LoanDTO> loans;
}
