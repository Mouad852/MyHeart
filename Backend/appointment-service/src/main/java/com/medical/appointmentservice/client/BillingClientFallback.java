package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.BillingRequest;
import com.medical.appointmentservice.exception.ExternalServiceException;
import org.springframework.stereotype.Component;

@Component
public class BillingClientFallback implements BillingClient {

    @Override
    public Object createInvoice(BillingRequest request) {
        throw new ExternalServiceException("Billing service is currently unavailable. Invoice not created for appointment id=" + request.getAppointmentId());
    }
}
