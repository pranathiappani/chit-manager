package com.chitmanager.backend.controllers;

import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.ChitGroupStatus;
import com.chitmanager.backend.models.CollectionStatus;
import com.chitmanager.backend.repositories.ActualPayoutRepository;
import com.chitmanager.backend.repositories.ChitGroupRepository;
import com.chitmanager.backend.repositories.CollectionRepository;
import com.chitmanager.backend.repositories.MemberRepository;
import com.chitmanager.backend.security.SecurityUtils;
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

import org.springframework.security.access.prepost.PreAuthorize;
import com.chitmanager.backend.models.PaymentMode;
import com.chitmanager.backend.models.Loan;
import com.chitmanager.backend.models.LoanPayment;
import com.chitmanager.backend.repositories.LoanRepository;
import com.chitmanager.backend.repositories.LoanPaymentRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    @Autowired
    private ChitGroupRepository chitGroupRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ActualPayoutRepository actualPayoutRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanPaymentRepository loanPaymentRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        String tenantId = SecurityUtils.getTenantId();
        
        // Fetch all groups belonging to the tenant once to minimize DB calls
        List<ChitGroup> allTenantGroups = chitGroupRepository.findAllByTenantId(tenantId);
        
        // 1. Total Active Chits
        long totalActiveChits = allTenantGroups.stream()
                .filter(cg -> ChitGroupStatus.ACTIVE.equals(cg.getStatus()))
                .count();

        // 2. Total Members
        long totalMembers = memberRepository.countByTenantId(tenantId);
        
        // 3. Profits of Completed Chits
        BigDecimal completedChitsProfit = allTenantGroups.stream()
                .filter(cg -> ChitGroupStatus.COMPLETED.equals(cg.getStatus()))
                .map(cg -> cg.getActualProfit() != null ? cg.getActualProfit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Chit-wise Collections outstanding
        List<Map<String, Object>> activeChitsCollectionDetails = new ArrayList<>();
        long totalPendingCollectionsCount = 0;

        List<ChitGroup> activeChits = allTenantGroups.stream()
                .filter(cg -> ChitGroupStatus.ACTIVE.equals(cg.getStatus()))
                .collect(Collectors.toList());

        for (ChitGroup group : activeChits) {
            // Find current active month from payouts
            List<com.chitmanager.backend.models.ActualPayout> payouts = actualPayoutRepository.findByTenantIdAndChitGroupIdOrderByPayoutDateAsc(tenantId, group.getId());
            int currentMonth = payouts.stream()
                    .mapToInt(com.chitmanager.backend.models.ActualPayout::getPayoutMonth)
                    .max()
                    .orElse(1);

            // Fetch collections for this group
            List<com.chitmanager.backend.models.Collection> collections = collectionRepository.findByTenantIdAndChitGroupId(tenantId, group.getId());
            
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

        // Calculate current month dates for testing
        LocalDate today = LocalDate.now();
        LocalDate startOfPrevMonth = today.withDayOfMonth(1);
        LocalDate endOfPrevMonth = today.with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

        // Current Month Label (e.g. "June 2026")
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
        String previousMonthLabel = startOfPrevMonth.format(monthFormatter);

        // Fetch all collections for the tenant
        List<com.chitmanager.backend.models.Collection> allCollections = collectionRepository.findAllByTenantId(tenantId);
        // Fetch all loan payments for the tenant
        List<LoanPayment> allLoanPayments = loanPaymentRepository.findAllByTenantId(tenantId);
        // Fetch all payouts for the tenant
        List<com.chitmanager.backend.models.ActualPayout> allPayouts = actualPayoutRepository.findAllByTenantId(tenantId);
        // Fetch all loans for the tenant
        List<Loan> allLoans = loanRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);

        // Filter and aggregate Inflow (Money Received) for previous month
        BigDecimal prevMonthCollectionsCash = BigDecimal.ZERO;
        BigDecimal prevMonthCollectionsPhonepe = BigDecimal.ZERO;
        BigDecimal prevMonthCollectionsGpay = BigDecimal.ZERO;
        BigDecimal prevMonthCollectionsOther = BigDecimal.ZERO;

        for (com.chitmanager.backend.models.Collection c : allCollections) {
            if (CollectionStatus.PAID.equals(c.getStatus()) && c.getPaymentDate() != null) {
                LocalDate date = c.getPaymentDate();
                if (!date.isBefore(startOfPrevMonth) && !date.isAfter(endOfPrevMonth)) {
                    BigDecimal amt = c.getAmountPaid() != null ? c.getAmountPaid() : BigDecimal.ZERO;
                    PaymentMode mode = c.getPaymentMode() != null ? c.getPaymentMode() : PaymentMode.CASH; // Default to CASH
                    switch (mode) {
                        case PHONEPE -> prevMonthCollectionsPhonepe = prevMonthCollectionsPhonepe.add(amt);
                        case GPAY -> prevMonthCollectionsGpay = prevMonthCollectionsGpay.add(amt);
                        case CASH -> prevMonthCollectionsCash = prevMonthCollectionsCash.add(amt);
                        case OTHER -> prevMonthCollectionsOther = prevMonthCollectionsOther.add(amt);
                    }
                }
            }
        }

        BigDecimal prevMonthLoanRepaymentsCash = BigDecimal.ZERO;
        BigDecimal prevMonthLoanRepaymentsPhonepe = BigDecimal.ZERO;
        BigDecimal prevMonthLoanRepaymentsGpay = BigDecimal.ZERO;
        BigDecimal prevMonthLoanRepaymentsOther = BigDecimal.ZERO;

        for (LoanPayment lp : allLoanPayments) {
            if (lp.getPaymentDate() != null) {
                LocalDate date = lp.getPaymentDate();
                if (!date.isBefore(startOfPrevMonth) && !date.isAfter(endOfPrevMonth)) {
                    BigDecimal amt = lp.getAmount() != null ? lp.getAmount() : BigDecimal.ZERO;
                    PaymentMode mode = lp.getPaymentMode() != null ? lp.getPaymentMode() : PaymentMode.CASH; // Default to CASH
                    switch (mode) {
                        case PHONEPE -> prevMonthLoanRepaymentsPhonepe = prevMonthLoanRepaymentsPhonepe.add(amt);
                        case GPAY -> prevMonthLoanRepaymentsGpay = prevMonthLoanRepaymentsGpay.add(amt);
                        case CASH -> prevMonthLoanRepaymentsCash = prevMonthLoanRepaymentsCash.add(amt);
                        case OTHER -> prevMonthLoanRepaymentsOther = prevMonthLoanRepaymentsOther.add(amt);
                    }
                }
            }
        }

        // Combine Inflow by Mode
        BigDecimal totalCash = prevMonthCollectionsCash.add(prevMonthLoanRepaymentsCash);
        BigDecimal totalPhonepe = prevMonthCollectionsPhonepe.add(prevMonthLoanRepaymentsPhonepe);
        BigDecimal totalGpay = prevMonthCollectionsGpay.add(prevMonthLoanRepaymentsGpay);
        BigDecimal totalOther = prevMonthCollectionsOther.add(prevMonthLoanRepaymentsOther);
        BigDecimal totalInflow = totalCash.add(totalPhonepe).add(totalGpay).add(totalOther);

        Map<String, Object> inflowStats = new HashMap<>();
        inflowStats.put("CASH", totalCash);
        inflowStats.put("PHONEPE", totalPhonepe);
        inflowStats.put("GPAY", totalGpay);
        inflowStats.put("OTHER", totalOther);
        inflowStats.put("total", totalInflow);

        // Filter and aggregate Outflow (Money Going Out) for previous month
        BigDecimal totalPayoutsAmt = BigDecimal.ZERO;
        for (com.chitmanager.backend.models.ActualPayout p : allPayouts) {
            if (p.getPayoutDate() != null) {
                LocalDate date = p.getPayoutDate();
                if (!date.isBefore(startOfPrevMonth) && !date.isAfter(endOfPrevMonth)) {
                    BigDecimal amt = p.getPayoutAmount() != null ? p.getPayoutAmount() : BigDecimal.ZERO;
                    totalPayoutsAmt = totalPayoutsAmt.add(amt);
                }
            }
        }

        BigDecimal totalLoansAmt = BigDecimal.ZERO;
        for (Loan l : allLoans) {
            if (l.getStartDate() != null) {
                LocalDate date = l.getStartDate();
                if (!date.isBefore(startOfPrevMonth) && !date.isAfter(endOfPrevMonth)) {
                    BigDecimal amt = l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO;
                    totalLoansAmt = totalLoansAmt.add(amt);
                }
            }
        }

        BigDecimal totalOutflow = totalPayoutsAmt.add(totalLoansAmt);

        Map<String, Object> outflowStats = new HashMap<>();
        outflowStats.put("PAYOUTS", totalPayoutsAmt);
        outflowStats.put("LOANS", totalLoansAmt);
        outflowStats.put("total", totalOutflow);

        // Put into stats map
        stats.put("previousMonthLabel", previousMonthLabel);
        stats.put("inflowStats", inflowStats);
        stats.put("outflowStats", outflowStats);

        stats.put("totalActiveChits", totalActiveChits);
        stats.put("totalMembers", totalMembers);
        stats.put("completedChitsProfit", completedChitsProfit);
        stats.put("pendingCollections", totalPendingCollectionsCount);
        stats.put("activeChitsCollectionDetails", activeChitsCollectionDetails);

        return ResponseEntity.ok(stats);
    }
}

