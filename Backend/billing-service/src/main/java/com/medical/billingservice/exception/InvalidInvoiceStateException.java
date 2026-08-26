package com.medical.billingservice.exception;

import com.medical.billingservice.entity.PaymentStatus;

/**
 * Raised when a caller asks for a status change the invoice lifecycle does not
 * allow, such as paying an invoice that was already voided.
 */
public class InvalidInvoiceStateException extends RuntimeException {

    public InvalidInvoiceStateException(PaymentStatus from, PaymentStatus to) {
        super(buildMessage(from, to));
    }

    private static String buildMessage(PaymentStatus from, PaymentStatus to) {
        if (from.isTerminal()) {
            return "This invoice is already " + from.name().toLowerCase()
                    + " and cannot be changed.";
        }
        return "An invoice cannot go from " + from + " to " + to
                + ". Allowed from " + from + ": " + from.allowedTransitions() + ".";
    }
}
