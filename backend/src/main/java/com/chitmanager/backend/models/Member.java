package com.chitmanager.backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.chitmanager.backend.security.CryptoConverter;

@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Convert(converter = CryptoConverter.class)
    private String name;

    @Convert(converter = CryptoConverter.class)
    private String phone;

    @Convert(converter = CryptoConverter.class)
    private String address;

    @Convert(converter = CryptoConverter.class)
    private String nominee;

    @Convert(converter = CryptoConverter.class)
    private String guarantor;

    @Column(nullable = false)
    private LocalDate joiningDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
