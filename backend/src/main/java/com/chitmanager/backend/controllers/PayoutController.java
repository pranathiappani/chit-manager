package com.chitmanager.backend.controllers;

import com.chitmanager.backend.dto.PayoutDTO;
import com.chitmanager.backend.dto.PayoutPlanDTO;
import com.chitmanager.backend.dto.PayoutSummaryDTO;
import com.chitmanager.backend.services.PayoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payouts")
public class PayoutController {

    @Autowired
    private PayoutService payoutService;

    @PostMapping
    public ResponseEntity<PayoutDTO> recordPayout(@RequestBody PayoutDTO payoutDTO) {
        return ResponseEntity.ok(payoutService.recordPayout(payoutDTO));
    }

    @GetMapping("/chit/{chitGroupId}")
    public ResponseEntity<List<PayoutDTO>> getPayoutsForChit(@PathVariable Long chitGroupId) {
        return ResponseEntity.ok(payoutService.getPayoutsForChit(chitGroupId));
    }

    @GetMapping("/chit/{chitGroupId}/summary")
    public ResponseEntity<PayoutSummaryDTO> getPayoutSummary(@PathVariable Long chitGroupId) {
        return ResponseEntity.ok(payoutService.getPayoutSummary(chitGroupId));
    }

    @PostMapping("/chit/{chitGroupId}/plans")
    public ResponseEntity<?> setupExpectedPayoutPlan(@PathVariable Long chitGroupId, @RequestBody List<PayoutPlanDTO> plans) {
        payoutService.setupExpectedPayoutPlan(chitGroupId, plans);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/chit/{chitGroupId}/plans")
    public ResponseEntity<List<PayoutPlanDTO>> getPayoutPlans(@PathVariable Long chitGroupId) {
        return ResponseEntity.ok(payoutService.getPayoutPlansForChit(chitGroupId));
    }
}
