package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.BillingRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "billing-service", fallback = BillingClientFallback.class)
public interface BillingClient {

    @PostMapping("/billing/create")
    Object createInvoice(@RequestBody BillingRequest request);
}
