package com.medical.labservice.storage;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Decides whether an uploaded file is allowed anywhere near the disk.
 *
 * The browser's declared Content-Type is a claim by whoever made the request,
 * not a fact, and the filename extension is the same. Both are trivially set to
 * anything. So the type is decided by reading the first few bytes of the file
 * and matching them against a short allow-list of formats a laboratory report
 * can legitimately be in.
 *
 * The list is an allow-list rather than a block-list on purpose. A block-list
 * has to anticipate every dangerous format and will always be one format
 * behind; SVG alone is enough to make that a losing game, since it is an image
 * to a human and a script host to a browser.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UploadedFileGuard {

    /** Refused before anything is read, so a huge upload cannot be used to fill the disk. */
    public static final long MAX_BYTES = 10L * 1024 * 1024;

    /** How many bytes of the file are needed to recognise it. */
    private static final int SNIFF_LENGTH = 12;

    @Getter
    @RequiredArgsConstructor
    public enum AllowedType {
        PDF("application/pdf", ".pdf", new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D}),
        PNG("image/png", ".png",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}),
        JPEG("image/jpeg", ".jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});

        private final String contentType;
        private final String extension;
        private final byte[] signature;

        boolean matches(byte[] head) {
            if (head.length < signature.length) {
                return false;
            }
            return Arrays.equals(head, 0, signature.length, signature, 0, signature.length);
        }
    }

    private static final List<AllowedType> ALLOWED = List.of(AllowedType.values());

    /**
     * @return the type the file actually is
     * @throws UnsupportedFileTypeException when the bytes match nothing allowed
     * @throws FileTooLargeException        when the upload exceeds the limit
     */
    public AllowedType inspect(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new UnsupportedFileTypeException("No file was uploaded.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new FileTooLargeException(file.getSize(), MAX_BYTES);
        }

        byte[] head = readHead(file);

        for (AllowedType type : ALLOWED) {
            if (type.matches(head)) {
                // Worth logging when the claim and the content disagree: it is
                // either a misconfigured client or somebody probing.
                String declared = file.getContentType();
                if (declared != null && !declared.toLowerCase(Locale.ROOT)
                        .startsWith(type.getContentType())) {
                    log.warn("Upload declared Content-Type '{}' but the bytes are {}; "
                            + "trusting the bytes", declared, type);
                }
                return type;
            }
        }

        log.warn("Rejected upload '{}' declared as '{}': the content is not a PDF, PNG or JPEG",
                file.getOriginalFilename(), file.getContentType());
        throw new UnsupportedFileTypeException(
                "A laboratory result must be a PDF, PNG or JPEG. "
                        + "The file that was uploaded is none of those, whatever it is named.");
    }

    private byte[] readHead(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            byte[] buffer = new byte[SNIFF_LENGTH];
            int read = in.readNBytes(buffer, 0, SNIFF_LENGTH);
            return read == SNIFF_LENGTH ? buffer : Arrays.copyOf(buffer, Math.max(read, 0));
        } catch (IOException e) {
            throw new UnsupportedFileTypeException("The uploaded file could not be read.");
        }
    }

    /** The upload is not one of the formats a laboratory result may be in. */
    public static class UnsupportedFileTypeException extends RuntimeException {
        public UnsupportedFileTypeException(String message) {
            super(message);
        }
    }

    /** The upload is larger than the service accepts. */
    public static class FileTooLargeException extends RuntimeException {
        public FileTooLargeException(long actual, long limit) {
            super(String.format(
                    "The file is %.1f MB. The limit is %d MB.",
                    actual / (1024d * 1024d), limit / (1024 * 1024)));
        }
    }
}
