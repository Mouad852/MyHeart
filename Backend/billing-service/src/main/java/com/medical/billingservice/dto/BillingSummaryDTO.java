package com.medical.billingservice.dto;

import com.medical.billingservice.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * The clinic's money, in numbers rather than rows.
 *
 * The overview screen used to fetch every invoice in order to count them. That
 * works while a demo database holds a dozen rows and stops working the moment
 * it does not. These totals are computed by the database, so the response size
 * is the same whether the clinic has raised ten invoices or ten million.
 */
public class BillingSummaryDTO {

    /** One row per invoice status: how many, and how much. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusTotal {
        private PaymentStatus status;
        private long count;
        private BigDecimal amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {

        /** Every status the clinic has invoices in, including the empty ones. */
        private List<StatusTotal> byStatus;

        /** Issued and not yet settled. */
        private long outstandingCount;
        private BigDecimal outstandingAmount;

        /** Outstanding and past its due date: the money actually at risk. */
        private long overdueCount;
        private BigDecimal overdueAmount;

        /** Settled, less anything refunded. */
        private long collectedCount;
        private BigDecimal collectedAmount;

        private long invoiceCount;

        /**
         * The currency these totals are in, or null when the clinic holds
         * invoices in more than one. Summing across currencies would produce a
         * number that looks authoritative and means nothing, so the totals say
         * so instead of hiding it.
         */
        private String currency;
    }
}
