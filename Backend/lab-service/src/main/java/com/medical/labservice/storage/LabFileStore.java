package com.medical.labservice.storage;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

/**
 * Where laboratory result files live.
 *
 * Two rules govern this class.
 *
 * The name the client sent never reaches the filesystem. A stored file is named
 * from a freshly generated UUID and the extension of the format the guard
 * actually recognised, so "../../etc/passwd" and "report.pdf.exe" are both
 * simply irrelevant. The original name is kept in the database as a label to
 * show the user and to name their download, and nowhere else.
 *
 * Every resolved path is checked to be inside the storage root before it is
 * touched, so even a bug elsewhere cannot make this class read or write outside
 * the directory it owns.
 */
@Component
@Slf4j
public class LabFileStore {

    private final Path root;

    public LabFileStore(@Value("${medcore.lab.storage-path:/var/lib/medcore/lab-results}") String path) {
        this.root = Paths.get(path).toAbsolutePath().normalize();
    }

    /**
     * Create the storage directory and prove it can be written to.
     *
     * The proof matters. A volume mounted with the wrong owner leaves a
     * directory that exists and is readable, so createDirectories succeeds and
     * the service starts perfectly happily; the failure then surfaces as a 500
     * on somebody's first upload. Failing here instead means the container never
     * reports healthy, which is a problem for whoever deployed it rather than
     * for whoever is trying to file a patient's blood results.
     */
    @PostConstruct
    void prepare() throws IOException {
        Files.createDirectories(root);

        Path probe = root.resolve(".write-probe");
        try {
            Files.writeString(probe, "ok");
            Files.delete(probe);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "The laboratory storage directory " + root + " is not writable by this "
                            + "process. Check the ownership of the mounted volume.", e);
        }

        log.info("Laboratory result files are stored under {}", root);
    }

    @Getter
    @Builder
    public static class StoredFile {
        /** Storage key, relative to the root. Never contains anything the client sent. */
        private final String key;
        private final String originalFilename;
        private final String contentType;
        private final long size;
        /** SHA-256 of the stored bytes, so corruption is detectable later. */
        private final String checksum;
    }

    /**
     * @param resultId the result this file belongs to, used only to group files
     *                 on disk so a directory listing is navigable
     */
    public StoredFile store(Long resultId, MultipartFile file, UploadedFileGuard.AllowedType type) {
        String key = resultId + "/" + UUID.randomUUID() + type.getExtension();
        Path target = resolve(key);

        try {
            Files.createDirectories(target.getParent());

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            long written;
            try (InputStream in = file.getInputStream();
                 DigestInputStream digesting = new DigestInputStream(in, digest)) {
                written = Files.copy(digesting, target, StandardCopyOption.REPLACE_EXISTING);
            }

            String checksum = HexFormat.of().formatHex(digest.digest());
            log.info("Stored lab result file for result {} as {} ({} bytes, sha256 {})",
                    resultId, key, written, checksum.substring(0, 12));

            return StoredFile.builder()
                    .key(key)
                    .originalFilename(displayName(file.getOriginalFilename(), type))
                    .contentType(type.getContentType())
                    .size(written)
                    .checksum(checksum)
                    .build();

        } catch (IOException e) {
            // Logged with the cause because the API response deliberately does
            // not carry filesystem detail out to a caller.
            log.error("Could not store the file for lab result {}: {}", resultId, e.toString(), e);
            throw new IllegalStateException("Could not store the laboratory result file", e);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is required of every JVM, so this cannot happen.
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    public byte[] read(String key) {
        Path source = resolve(key);
        if (!Files.isRegularFile(source)) {
            throw new IllegalStateException(
                    "The stored file for this result is missing: " + key);
        }
        try {
            return Files.readAllBytes(source);
        } catch (IOException e) {
            throw new IllegalStateException("Could not read the stored file " + key, e);
        }
    }

    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            log.warn("Could not delete stored file {}: {}", key, e.getMessage());
        }
    }

    /**
     * Resolve a key against the root, refusing anything that escapes it.
     *
     * Keys are generated by this class, so in normal operation nothing can
     * escape. The check is here because "in normal operation" is exactly the
     * assumption path traversal bugs are made of.
     */
    private Path resolve(String key) {
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root)) {
            log.error("Refused a storage key that escapes the root: {}", key);
            throw new SecurityException("Invalid storage key");
        }
        return resolved;
    }

    /**
     * A safe label for the file, shown in the UI and used to name downloads.
     *
     * Stripped of any path, of anything that is not a plain character, and
     * capped in length. It is never used to build a path, but it does end up in
     * a Content-Disposition header and on somebody's screen.
     */
    private String displayName(String original, UploadedFileGuard.AllowedType type) {
        if (original == null || original.isBlank()) {
            return "result" + type.getExtension();
        }
        String base = Paths.get(original).getFileName().toString();
        String cleaned = base.replaceAll("[^A-Za-z0-9._-]", "_");
        if (cleaned.length() > 120) {
            cleaned = cleaned.substring(0, 120);
        }
        if (!cleaned.toLowerCase(Locale.ROOT).endsWith(type.getExtension())) {
            cleaned = cleaned + type.getExtension();
        }
        return cleaned;
    }
}
