package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.BillingRequest;
import com.medical.appointmentservice.exception.ExternalServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * Fallback factory for billing-service.
 *
 * Invoice creation is best-effort: {@code AppointmentServiceImpl} catches this
 * exception so that a billing outage never rolls back a confirmed appointment.
 * The cause is logged here so the failure is visible rather than silent.
 */
@Component
@Slf4j
public class BillingClientFallbackFactory implements FallbackFactory<BillingClient> {

    @Override
    public BillingClient create(Throwable cause) {
        return new BillingClient() {
            @Override
            public Object createInvoice(BillingRequest request) {
                log.error("billing-service unavailable, invoice not created for appointment id={}: {}",
                        request.getAppointmentId(), cause.toString());
                throw new ExternalServiceException(
                        "Billing service is currently unavailable. Invoice not created for appointment id="
                                + request.getAppointmentId());
            }
        };
    }
}
