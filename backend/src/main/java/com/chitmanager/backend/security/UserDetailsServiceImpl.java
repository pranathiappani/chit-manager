package com.chitmanager.backend.security;

import com.chitmanager.backend.models.Tenant;
import com.chitmanager.backend.repositories.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    TenantRepository tenantRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Tenant tenant = tenantRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant Not Found with username: " + username));

        return UserDetailsImpl.build(tenant);
    }
}
