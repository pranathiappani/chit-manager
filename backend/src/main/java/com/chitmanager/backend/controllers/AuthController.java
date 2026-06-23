package com.chitmanager.backend.controllers;

import com.chitmanager.backend.models.Role;
import com.chitmanager.backend.models.Tenant;
import com.chitmanager.backend.payload.request.LoginRequest;
import com.chitmanager.backend.payload.request.SignupRequest;
import com.chitmanager.backend.payload.response.JwtResponse;
import com.chitmanager.backend.repositories.TenantRepository;
import com.chitmanager.backend.security.JwtUtils;
import com.chitmanager.backend.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    PasswordEncoder encoder;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getAuthorities().iterator().next().getAuthority(),
                userDetails.getTenantId()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerTenant(@Valid @RequestBody SignupRequest signUpRequest) {
        if (tenantRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Error: Username is already taken!"));
        }

        // Generate next automatic sequential tenant ID
        long count = tenantRepository.count();
        String nextTenantId = String.valueOf(count + 1);
        while (tenantRepository.findByTenantId(nextTenantId).isPresent()) {
            count++;
            nextTenantId = String.valueOf(count + 1);
        }

        // Create new tenant account with ROLE_ADMIN role so they can configure their own data
        Tenant tenant = Tenant.builder()
                .tenantId(nextTenantId)
                .username(signUpRequest.getUsername())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(Role.ROLE_ADMIN)
                .build();

        tenantRepository.save(tenant);

        return ResponseEntity.ok(Map.of(
                "message", "Tenant registered successfully!",
                "tenantId", nextTenantId,
                "username", tenant.getUsername()
        ));
    }
}
