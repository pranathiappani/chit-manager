package com.chitmanager.backend.controllers;

import com.chitmanager.backend.repositories.*;
import com.chitmanager.backend.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private LoanPaymentRepository loanPaymentRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private ActualPayoutRepository actualPayoutRepository;

    @Autowired
    private PayoutPlanRepository payoutPlanRepository;

    @Autowired
    private ChitMemberRepository chitMemberRepository;

    @Autowired
    private ChitGroupRepository chitGroupRepository;

    @Autowired
    private MemberRepository memberRepository;

    @PostMapping("/clear")
    @Transactional
    public ResponseEntity<?> clearAllData() {
        String tenantId = SecurityUtils.getTenantId();

        // Delete all dependent transactional data belonging to the tenant
        loanPaymentRepository.deleteByTenantId(tenantId);
        loanRepository.deleteByTenantId(tenantId);
        collectionRepository.deleteByTenantId(tenantId);
        actualPayoutRepository.deleteByTenantId(tenantId);
        payoutPlanRepository.deleteByTenantId(tenantId);
        chitMemberRepository.deleteByTenantId(tenantId);
        chitGroupRepository.deleteByTenantId(tenantId);
        memberRepository.deleteByTenantId(tenantId);

        return ResponseEntity.ok("All live data has been successfully cleared for tenant: " + tenantId);
    }
}
