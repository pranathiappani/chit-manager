package com.chitmanager.backend.config;

import com.chitmanager.backend.models.Role;
import com.chitmanager.backend.models.Tenant;
import com.chitmanager.backend.repositories.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // 1. Migrate existing legacy data (if any) to alphanumeric format
        migrateLegacyData();

        // 2. Seed default admin credentials (tenant_id = "T-001")
        if (tenantRepository.findByUsername("admin").isEmpty()) {
            Tenant admin = Tenant.builder()
                    .tenantId("T-001")
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_ADMIN)
                    .build();
            tenantRepository.save(admin);
            System.out.println("Default admin tenant created: admin / admin123 (Tenant: T-001)");
        }

        // 3. Seed default demo credentials (tenant_id = "T-002")
        if (tenantRepository.findByUsername("demo").isEmpty()) {
            Tenant demo = Tenant.builder()
                    .tenantId("T-002")
                    .username("demo")
                    .password(passwordEncoder.encode("demo123"))
                    .role(Role.ROLE_ADMIN) // Granting admin role to demo account as well
                    .build();
            tenantRepository.save(demo);
            System.out.println("Default demo tenant created: demo / demo123 (Tenant: T-002)");
        }
    }

    private void migrateLegacyData() {
        System.out.println("Running database tenant migrations for legacy values...");
        try {
            // 1. Query all unique tenant IDs currently in the tenants table
            List<String> tenantIds = jdbcTemplate.queryForList("SELECT DISTINCT tenant_id FROM tenants", String.class);
            
            String[] tables = {
                "members", "chit_groups", "chit_members", "collections", 
                "loans", "loan_payments", "actual_payouts", "payout_plans", "profit_ledger"
            };

            // 2. For each tenant ID, check if it is numeric and dynamically migrate it
            if (tenantIds != null) {
                for (String tenantId : tenantIds) {
                    if (tenantId == null) continue;
                    try {
                        int num = Integer.parseInt(tenantId.trim());
                        String newTenantId = String.format("T-%03d", num);
                        
                        if (!newTenantId.equals(tenantId)) {
                            System.out.println("Migrating legacy numeric tenant: " + tenantId + " -> " + newTenantId);
                            // Update tenants table
                            jdbcTemplate.update("UPDATE tenants SET tenant_id = ? WHERE tenant_id = ?", newTenantId, tenantId);
                            // Update all transactional tables
                            for (String table : tables) {
                                jdbcTemplate.update("UPDATE " + table + " SET tenant_id = ? WHERE tenant_id = ?", newTenantId, tenantId);
                            }
                        }
                    } catch (NumberFormatException e) {
                        // Already formatted as T-XXX or custom string, skip
                    }
                }
            }

            // 3. Migrate any remaining null values to default tenant T-001
            for (String table : tables) {
                jdbcTemplate.update("UPDATE " + table + " SET tenant_id = 'T-001' WHERE tenant_id IS NULL");
            }
            
            System.out.println("Tenant migration completed successfully.");
        } catch (Exception e) {
            System.err.println("Warning: Tenant migration query skipped or encountered an error (this is normal if tables are empty or not yet created): " + e.getMessage());
        }
    }
}
