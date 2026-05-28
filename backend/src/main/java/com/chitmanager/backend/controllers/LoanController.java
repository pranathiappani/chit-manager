package com.chitmanager.backend.controllers;

import com.chitmanager.backend.dto.LoanDTO;
import com.chitmanager.backend.dto.LoanPaymentDTO;
import com.chitmanager.backend.services.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

    @PostMapping
    public ResponseEntity<LoanDTO> recordLoan(@RequestBody LoanDTO dto) {
        return ResponseEntity.ok(loanService.recordLoan(dto));
    }

    @GetMapping
    public ResponseEntity<List<LoanDTO>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<LoanDTO> closeLoan(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(loanService.closeLoan(id, endDate));
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<LoanPaymentDTO> recordLoanPayment(
            @PathVariable Long id,
            @RequestBody LoanPaymentDTO dto) {
        return ResponseEntity.ok(loanService.recordLoanPayment(id, dto));
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<LoanPaymentDTO>> getLoanPayments(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanPayments(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLoan(@PathVariable Long id) {
        loanService.deleteLoan(id);
        return ResponseEntity.ok("Loan record deleted successfully");
    }
}
