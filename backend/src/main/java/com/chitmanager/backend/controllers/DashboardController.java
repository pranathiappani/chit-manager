package com.chitmanager.backend.controllers;

import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.ChitGroupStatus;
import com.chitmanager.backend.models.CollectionStatus;
import com.chitmanager.backend.repositories.ActualPayoutRepository;
import com.chitmanager.backend.repositories.ChitGroupRepository;
import com.chitmanager.backend.repositories.CollectionRepository;
import com.chitmanager.backend.repositories.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private ChitGroupRepository chitGroupRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ActualPayoutRepository actualPayoutRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // 1. Total Active Chits
        long totalActiveChits = chitGroupRepository.findAll().stream()
                .filter(cg -> ChitGroupStatus.ACTIVE.equals(cg.getStatus()))
                .count();

        // 2. Total Members
        long totalMembers = memberRepository.count();
        
        // 3. Profits of Completed Chits
        BigDecimal completedChitsProfit = chitGroupRepository.findAll().stream()
                .filter(cg -> ChitGroupStatus.COMPLETED.equals(cg.getStatus()))
                .map(cg -> cg.getActualProfit() != null ? cg.getActualProfit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Chit-wise Collections outstanding
        List<Map<String, Object>> activeChitsCollectionDetails = new ArrayList<>();
        long totalPendingCollectionsCount = 0;

        List<ChitGroup> activeChits = chitGroupRepository.findAll().stream()
                .filter(cg -> ChitGroupStatus.ACTIVE.equals(cg.getStatus()))
                .collect(Collectors.toList());

        for (ChitGroup group : activeChits) {
            // Find current active month from payouts
            List<com.chitmanager.backend.models.ActualPayout> payouts = actualPayoutRepository.findByChitGroupIdOrderByPayoutDateAsc(group.getId());
            int currentMonth = payouts.stream()
                    .mapToInt(com.chitmanager.backend.models.ActualPayout::getPayoutMonth)
                    .max()
                    .orElse(1);

            // Fetch collections for this group
            List<com.chitmanager.backend.models.Collection> collections = collectionRepository.findByChitGroupId(group.getId());
            
            // Count paid collections for this current month
            long paidMembersCount = collections.stream()
                    .filter(c -> c.getForMonth() == currentMonth && CollectionStatus.PAID.equals(c.getStatus()))
                    .count();

            int totalMembersInGroup = group.getMemberCount() != null ? group.getMemberCount() : 0;
            int pendingMembersCount = totalMembersInGroup - (int) paidMembersCount;
            if (pendingMembersCount < 0) {
                pendingMembersCount = 0;
            }

            BigDecimal monthlyContribution = group.getMonthlyCollection() != null ? group.getMonthlyCollection() : BigDecimal.ZERO;
            BigDecimal pendingAmount = monthlyContribution.multiply(new BigDecimal(pendingMembersCount));

            totalPendingCollectionsCount += pendingMembersCount;

            Map<String, Object> chitDetails = new HashMap<>();
            chitDetails.put("chitId", group.getId());
            chitDetails.put("chitName", group.getName());
            chitDetails.put("currentMonth", currentMonth);
            chitDetails.put("monthlyCollection", monthlyContribution);
            chitDetails.put("totalMembers", totalMembersInGroup);
            chitDetails.put("paidMembersCount", paidMembersCount);
            chitDetails.put("pendingMembersCount", pendingMembersCount);
            chitDetails.put("pendingAmount", pendingAmount);

            activeChitsCollectionDetails.add(chitDetails);
        }

        stats.put("totalActiveChits", totalActiveChits);
        stats.put("totalMembers", totalMembers);
        stats.put("completedChitsProfit", completedChitsProfit);
        stats.put("pendingCollections", totalPendingCollectionsCount);
        stats.put("activeChitsCollectionDetails", activeChitsCollectionDetails);

        return ResponseEntity.ok(stats);
    }
}

