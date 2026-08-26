package com.medical.billingservice.entity;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * The lifecycle of an invoice.
 *
 * <pre>
 *   ISSUED ──pay──▶ PAID ──refund──▶ REFUNDED
 *      │
 *      └──void──▶ VOID
 * </pre>
 *
 * There is deliberately no OVERDUE state. Being overdue is not something that
 * happens to an invoice, it is what an unpaid invoice becomes once its due date
 * passes. Storing it would need a scheduled job to keep the column honest, and
 * the column would still be wrong between runs. It is derived instead.
 */
public enum PaymentStatus {

    /** Sent to the patient and awaiting payment. */
    ISSUED,

    /** Settled. */
    PAID,

    /** Cancelled before payment, for example when the appointment never happened. */
    VOID,

    /** Paid and then returned. */
    REFUNDED;

    private static final Map<PaymentStatus, Set<PaymentStatus>> ALLOWED = Map.of(
            ISSUED, EnumSet.of(PAID, VOID),
            PAID, EnumSet.of(REFUNDED),
            VOID, EnumSet.noneOf(PaymentStatus.class),
            REFUNDED, EnumSet.noneOf(PaymentStatus.class));

    public boolean canTransitionTo(PaymentStatus target) {
        return target != null && ALLOWED.get(this).contains(target);
    }

    public boolean isTerminal() {
        return ALLOWED.get(this).isEmpty();
    }

    /** True while the clinic is still owed money. */
    public boolean isOutstanding() {
        return this == ISSUED;
    }

    public Set<PaymentStatus> allowedTransitions() {
        return Collections.unmodifiableSet(ALLOWED.get(this));
    }
}
