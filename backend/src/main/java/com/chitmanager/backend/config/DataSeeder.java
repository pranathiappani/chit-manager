package com.chitmanager.backend.config;

import com.chitmanager.backend.models.Role;
import com.chitmanager.backend.models.Tenant;
import com.chitmanager.backend.repositories.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
        // 1. Migrate existing legacy data (if any) to default tenant "1"
        migrateLegacyData();

        // 2. Seed default admin credentials (tenant_id = "1")
        if (tenantRepository.findByUsername("admin").isEmpty()) {
            Tenant admin = Tenant.builder()
                    .tenantId("1")
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_ADMIN)
                    .build();
            tenantRepository.save(admin);
            System.out.println("Default admin tenant created: admin / admin123 (Tenant: 1)");
        }

        // 3. Seed default demo credentials (tenant_id = "2")
        if (tenantRepository.findByUsername("demo").isEmpty()) {
            Tenant demo = Tenant.builder()
                    .tenantId("2")
                    .username("demo")
                    .password(passwordEncoder.encode("demo123"))
                    .role(Role.ROLE_ADMIN) // Granting admin role to demo account as well
                    .build();
            tenantRepository.save(demo);
            System.out.println("Default demo tenant created: demo / demo123 (Tenant: 2)");
        }
    }

    private void migrateLegacyData() {
        System.out.println("Running database tenant migrations for legacy null values...");
        try {
            jdbcTemplate.execute("UPDATE members SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE chit_groups SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE chit_members SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE collections SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE loans SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE loan_payments SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE actual_payouts SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE payout_plans SET tenant_id = '1' WHERE tenant_id IS NULL");
            jdbcTemplate.execute("UPDATE profit_ledger SET tenant_id = '1' WHERE tenant_id IS NULL");
            System.out.println("Tenant migration completed successfully.");
        } catch (Exception e) {
            System.err.println("Warning: Tenant migration query skipped or encountered an error (this is normal if tables are empty or not yet created): " + e.getMessage());
        }
    }
}
