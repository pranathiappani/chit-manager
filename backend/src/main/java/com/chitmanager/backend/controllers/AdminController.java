package com.chitmanager.backend.controllers;

import com.chitmanager.backend.models.Role;
import com.chitmanager.backend.models.User;
import com.chitmanager.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/clear")
    @Transactional
    public ResponseEntity<?> clearAllData() {
        // Delete all dependent transactional data
        loanPaymentRepository.deleteAll();
        loanRepository.deleteAll();
        collectionRepository.deleteAll();
        actualPayoutRepository.deleteAll();
        payoutPlanRepository.deleteAll();
        chitMemberRepository.deleteAll();
        chitGroupRepository.deleteAll();
        memberRepository.deleteAll();
        
        // Delete all users and reseed admin
        userRepository.deleteAll();
        userRepository.flush(); // Force database sync so delete executes before insert
        
        User admin = User.builder()
                .username("admin")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(Role.ROLE_ADMIN)
                .build();
        userRepository.save(admin);

        return ResponseEntity.ok("All live data has been successfully cleared and default admin user has been reseeded.");
    }
}
