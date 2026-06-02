package com.chitmanager.backend.controllers;

import com.chitmanager.backend.dto.ChitGroupDTO;
import com.chitmanager.backend.dto.MemberDTO;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.services.ChitGroupService;
import com.chitmanager.backend.services.PayoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/chits")
public class ChitGroupController {

    @Autowired
    private ChitGroupService chitGroupService;

    @Autowired
    private PayoutService payoutService;

    @GetMapping
    public ResponseEntity<List<ChitGroupDTO>> getAllChitGroups() {
        return ResponseEntity.ok(chitGroupService.getAllChitGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChitGroupDTO> getChitGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(chitGroupService.getChitGroupById(id));
    }

    @PostMapping
    public ResponseEntity<ChitGroupDTO> createChitGroup(@RequestBody ChitGroupDTO chitGroupDTO) {
        return ResponseEntity.ok(chitGroupService.createChitGroup(chitGroupDTO));
    }

    @PostMapping("/{chitId}/members/{memberId}")
    public ResponseEntity<?> addMemberToChitGroup(@PathVariable Long chitId, @PathVariable Long memberId) {
        chitGroupService.addMemberToChitGroup(chitId, memberId);
        return ResponseEntity.ok("Member added to chit group successfully");
    }

    @DeleteMapping("/{chitId}/members/{memberId}")
    public ResponseEntity<?> removeMemberFromChitGroup(@PathVariable Long chitId, @PathVariable Long memberId) {
        chitGroupService.removeMemberFromChitGroup(chitId, memberId);
        return ResponseEntity.ok("Member removed from chit group successfully");
    }

    @GetMapping("/{chitId}/members")
    public ResponseEntity<List<MemberDTO>> getChitGroupMembers(@PathVariable Long chitId) {
        List<Member> members = chitGroupService.getChitGroupMembers(chitId);
        List<MemberDTO> memberDTOs = members.stream().map(member -> {
            MemberDTO dto = new MemberDTO();
            dto.setId(member.getId());
            dto.setName(member.getName());
            dto.setPhone(member.getPhone());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(memberDTOs);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteChitGroup(@PathVariable Long id) {
        chitGroupService.deleteChitGroup(id);
        return ResponseEntity.ok("Chit group deleted successfully");
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeChitGroup(@PathVariable Long id) {
        payoutService.completeChit(id);
        return ResponseEntity.ok("Chit group marked as completed and final profit calculated");
    }

    @GetMapping("/{id}/pending-dues")
    public ResponseEntity<Map<String, Object>> getPendingDues(@PathVariable Long id) {
        return ResponseEntity.ok(chitGroupService.getPendingDues(id));
    }
}
