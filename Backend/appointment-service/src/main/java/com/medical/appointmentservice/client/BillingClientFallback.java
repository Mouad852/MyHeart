package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.BillingRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class BillingClientFallback implements BillingClient {

    @Override
    public Object createInvoice(BillingRequest request) {
        log.warn("Billing service unavailable. Invoice creation skipped for appointmentId={}",
                request.getAppointmentId());
        return null;
    }
}
