package com.medical.billingservice.service;

import com.medical.billingservice.dto.ClinicServiceDTO;
import com.medical.billingservice.entity.ClinicService;
import com.medical.billingservice.exception.ResourceNotFoundException;
import com.medical.billingservice.repository.ClinicServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * The priced list of things the clinic does.
 *
 * Every invoice is priced from here, so a change of price is an administrative
 * act rather than a code change in whichever service happens to raise the
 * invoice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClinicServiceCatalogue {

    /** Used when a caller does not name a service. */
    public static final String DEFAULT_SERVICE_CODE = "CONSULTATION";

    private final ClinicServiceRepository repository;

    @Transactional(readOnly = true)
    public List<ClinicServiceDTO.Response> listActive() {
        return repository.findByActiveTrueOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClinicService requireByCode(String code) {
        String wanted = (code == null || code.isBlank()) ? DEFAULT_SERVICE_CODE : code.trim();
        return repository.findByCode(wanted)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No clinic service with code " + wanted));
    }

    public ClinicServiceDTO.Response updatePrice(String code, ClinicServiceDTO.Request request) {
        ClinicService service = requireByCode(code);
        if (request.getPrice() != null) {
            log.info("Price of {} changed from {} to {}",
                    service.getCode(), service.getPrice(), request.getPrice());
            service.setPrice(request.getPrice());
        }
        if (request.getName() != null) {
            service.setName(request.getName());
        }
        if (request.getDescription() != null) {
            service.setDescription(request.getDescription());
        }
        if (request.getDurationMinutes() != null) {
            service.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getActive() != null) {
            service.setActive(request.getActive());
        }
        return toResponse(repository.save(service));
    }

    private ClinicServiceDTO.Response toResponse(ClinicService service) {
        return ClinicServiceDTO.Response.builder()
                .id(service.getId())
                .code(service.getCode())
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .currency(service.getCurrency())
                .durationMinutes(service.getDurationMinutes())
                .active(service.getActive())
                .build();
    }
}
