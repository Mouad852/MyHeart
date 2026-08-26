package com.medical.labservice.service;

import lombok.Builder;
import lombok.Getter;

/**
 * A stored report on its way back out to a caller: the bytes, and the few facts
 * needed to write correct response headers for them.
 */
@Getter
@Builder
public class LabAttachment {
    private final byte[] content;
    private final String filename;
    private final String contentType;
    private final long size;
}
