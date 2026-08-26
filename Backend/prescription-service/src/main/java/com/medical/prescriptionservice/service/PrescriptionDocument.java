package com.medical.prescriptionservice.service;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.medical.prescriptionservice.dto.PartyInfo;
import com.medical.prescriptionservice.dto.PrescriptionDTO;
import com.medical.prescriptionservice.dto.PrescriptionItemDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Renders a prescription as a printable A4 document.
 *
 * A prescription is handed to a pharmacist, so the layout is ordered the way it
 * is read at a counter: who it is for, who wrote it, what to dispense, and the
 * signature that makes it valid. Everything decorative is left out.
 *
 * The document carries a demonstration notice. This system holds invented
 * records, and a page that looks like a prescription without saying otherwise
 * is a page somebody could try to present at a pharmacy.
 */
@Component
@Slf4j
public class PrescriptionDocument {

    /** Placeholder clinic identity. Would come from configuration in a real deployment. */
    private static final String CLINIC_NAME = "MedCore Clinic";
    private static final String CLINIC_ADDRESS = "12 Rue Hassan II, Casablanca";

    private static final Color INK = new Color(0x11, 0x18, 0x27);
    private static final Color MUTED = new Color(0x6B, 0x72, 0x80);
    private static final Color RULE = new Color(0xD1, 0xD5, 0xDB);
    private static final Color ACCENT = new Color(0x0D, 0x94, 0x88);

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMMM yyyy");
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("d MMMM yyyy 'at' HH:mm");

    private static Font font(float size, int style, Color colour) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, colour);
    }

    /**
     * @param prescription the record to print
     * @param patient      never null: the caller must resolve the patient first,
     *                     because a prescription that does not name the person it
     *                     is for cannot safely be printed at all
     * @param doctor       may be null if doctor-service could not be reached; the
     *                     prescriber is then shown by record number, which is
     *                     degraded but not dangerous
     */
    public byte[] render(PrescriptionDTO prescription, PartyInfo.Patient patient, PartyInfo.Doctor doctor) {
        if (patient == null || patient.getName() == null || patient.getName().isBlank()) {
            throw new IllegalArgumentException(
                    "A prescription cannot be printed without the patient it names");
        }

        Document document = new Document(PageSize.A4, 56, 56, 48, 56);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.addTitle("Prescription " + reference(prescription.getId()));
            document.addCreator(CLINIC_NAME);
            document.open();

            document.add(letterhead(prescription));
            document.add(rule(8f, 16f));
            document.add(parties(prescription, patient, doctor));
            document.add(rule(16f, 14f));
            document.add(labelled("Diagnosis", blankToDash(prescription.getDiagnosis()), 0f));
            document.add(medication(prescription.getItems()));

            if (prescription.getNotes() != null && !prescription.getNotes().isBlank()) {
                // The medication table ends on a rule, so Notes needs room or the
                // heading reads as part of the last row.
                document.add(labelled("Notes", prescription.getNotes(), 20f));
            }

            document.add(signature(doctor));
            document.add(footer(prescription));

            document.close();
        } catch (DocumentException e) {
            throw new IllegalStateException(
                    "Could not render prescription " + prescription.getId(), e);
        }

        log.info("Rendered prescription {} as PDF ({} bytes)", prescription.getId(), out.size());
        return out.toByteArray();
    }

    private Element letterhead(PrescriptionDTO prescription) {
        PdfPTable table = borderless(new float[]{1f, 1f});

        PdfPCell left = cell();
        Paragraph clinic = new Paragraph();
        clinic.add(new Chunk(CLINIC_NAME + "\n", font(15f, Font.BOLD, INK)));
        clinic.add(new Chunk(CLINIC_ADDRESS, font(8.5f, Font.NORMAL, MUTED)));
        left.addElement(clinic);
        table.addCell(left);

        PdfPCell right = cell();
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph reference = new Paragraph();
        reference.setAlignment(Element.ALIGN_RIGHT);
        reference.add(new Chunk("PRESCRIPTION\n", font(9f, Font.BOLD, ACCENT)));
        reference.add(new Chunk(reference(prescription.getId()), font(11f, Font.BOLD, INK)));
        right.addElement(reference);
        table.addCell(right);

        return table;
    }

    private Element parties(PrescriptionDTO prescription, PartyInfo.Patient patient, PartyInfo.Doctor doctor) {
        PdfPTable table = borderless(new float[]{1f, 1f});

        PdfPCell forWhom = cell();
        forWhom.addElement(heading("For"));
        forWhom.addElement(body(patient.getName(), Font.BOLD, 11.5f));
        forWhom.addElement(body("Record " + reference(patient.getId()), Font.NORMAL, 8.5f));
        if (patient.getPhone() != null && !patient.getPhone().isBlank()) {
            forWhom.addElement(body(patient.getPhone(), Font.NORMAL, 8.5f));
        }
        table.addCell(forWhom);

        PdfPCell byWhom = cell();
        byWhom.addElement(heading("Prescribed by"));
        if (doctor != null && doctor.getName() != null) {
            byWhom.addElement(body(doctor.getName(), Font.BOLD, 11.5f));
            if (doctor.getSpecialty() != null && !doctor.getSpecialty().isBlank()) {
                byWhom.addElement(body(doctor.getSpecialty(), Font.NORMAL, 8.5f));
            }
        } else {
            // doctor-service was unreachable. The prescriber is still identified,
            // by the number that appears in the clinic's own records.
            byWhom.addElement(body("Practitioner " + reference(prescription.getDoctorId()),
                    Font.BOLD, 11.5f));
        }
        byWhom.addElement(body("Issued " + issuedOn(prescription), Font.NORMAL, 8.5f));
        table.addCell(byWhom);

        return table;
    }

    private Element medication(List<PrescriptionItemDTO> items) {
        PdfPTable wrapper = borderless(new float[]{1f});
        PdfPCell holder = cell();
        holder.setPaddingTop(14f);
        holder.addElement(heading("Medication"));

        if (items == null || items.isEmpty()) {
            holder.addElement(body("No medication was prescribed.", Font.ITALIC, 10f));
            wrapper.addCell(holder);
            return wrapper;
        }

        PdfPTable table = new PdfPTable(new float[]{3.2f, 1.4f, 2.0f, 1.6f});
        table.setWidthPercentage(100);
        table.setSpacingBefore(6f);

        for (String column : new String[]{"Medicine", "Dosage", "Frequency", "Duration"}) {
            PdfPCell head = new PdfPCell(new Phrase(column, font(8f, Font.BOLD, MUTED)));
            head.setBorder(Rectangle.BOTTOM);
            head.setBorderColor(RULE);
            head.setPadding(6f);
            head.setBackgroundColor(Color.WHITE);
            table.addCell(head);
        }

        for (PrescriptionItemDTO item : items) {
            table.addCell(dataCell(item.getMedicineName(), Font.BOLD));
            table.addCell(dataCell(item.getDosage(), Font.NORMAL));
            table.addCell(dataCell(item.getFrequency(), Font.NORMAL));
            table.addCell(dataCell(item.getDuration(), Font.NORMAL));

            // How to take it is the line a patient actually gets wrong, so it
            // runs the full width underneath rather than being squeezed into a
            // fifth column nobody can read.
            if (item.getInstructions() != null && !item.getInstructions().isBlank()) {
                PdfPCell note = new PdfPCell(new Phrase(item.getInstructions(),
                        font(8.5f, Font.ITALIC, MUTED)));
                note.setColspan(4);
                note.setBorder(Rectangle.BOTTOM);
                note.setBorderColor(RULE);
                note.setPaddingBottom(8f);
                note.setPaddingLeft(6f);
                table.addCell(note);
            }
        }

        holder.addElement(table);
        wrapper.addCell(holder);
        return wrapper;
    }

    private PdfPCell dataCell(String value, int style) {
        PdfPCell cell = new PdfPCell(new Phrase(blankToDash(value), font(10f, style, INK)));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(8f);
        cell.setPaddingBottom(2f);
        cell.setPaddingLeft(6f);
        return cell;
    }

    private Element signature(PartyInfo.Doctor doctor) {
        PdfPTable table = borderless(new float[]{1.4f, 1f});
        table.setSpacingBefore(46f);

        // Left half stays empty so the signature sits where a hand reaches it.
        table.addCell(cell());

        // The cell's own top border is the line that gets signed, rather than a
        // nested table drawing one. The nested version left a stray glyph on the
        // page from the spacer paragraph that positioned it.
        PdfPCell sign = new PdfPCell();
        sign.setBorder(Rectangle.TOP);
        sign.setBorderColor(RULE);
        sign.setPaddingTop(6f);
        sign.addElement(body("Signature", Font.NORMAL, 8f));
        if (doctor != null && doctor.getName() != null) {
            sign.addElement(body(doctor.getName(), Font.NORMAL, 8f));
        }
        table.addCell(sign);

        return table;
    }

    private Element footer(PrescriptionDTO prescription) {
        Paragraph paragraph = new Paragraph();
        paragraph.setSpacingBefore(26f);
        paragraph.add(new Chunk(
                "Generated by " + CLINIC_NAME + " on "
                        + LocalDateTime.now().format(STAMP) + ".\n",
                font(7.5f, Font.NORMAL, MUTED)));
        // The document must not be mistakable for a real prescription. This
        // system holds invented records and is a demonstration of the software,
        // not a medical instrument.
        paragraph.add(new Chunk(
                "This is a demonstration document produced by a portfolio project. "
                        + "The records it contains are fictional and it is not a valid "
                        + "medical prescription.",
                font(7.5f, Font.BOLD, MUTED)));
        return paragraph;
    }

    // ---- small helpers -----------------------------------------------------

    private PdfPTable borderless(float[] widths) {
        PdfPTable table = new PdfPTable(widths);
        table.setWidthPercentage(100);
        return table;
    }

    private PdfPCell cell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0f);
        return cell;
    }

    private Paragraph heading(String text) {
        Paragraph paragraph = new Paragraph(text.toUpperCase(), font(8f, Font.BOLD, MUTED));
        paragraph.setSpacingAfter(4f);
        return paragraph;
    }

    private Paragraph body(String text, int style, float size) {
        Paragraph paragraph = new Paragraph(text, font(size, style, INK));
        paragraph.setLeading(size * 1.45f);
        return paragraph;
    }

    /**
     * A small headed block. The caller states the space above it, because how
     * much a block needs depends on whether a rule or a table sits before it.
     */
    private Element labelled(String label, String value, float above) {
        PdfPTable wrapper = borderless(new float[]{1f});
        PdfPCell holder = cell();
        holder.setPaddingTop(above);
        holder.addElement(heading(label));
        holder.addElement(body(value, Font.NORMAL, 10.5f));
        wrapper.addCell(holder);
        return wrapper;
    }

    private Element rule(float above, float below) {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingBefore(above);
        table.setSpacingAfter(below);
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(RULE);
        cell.setFixedHeight(1f);
        table.addCell(cell);
        return table;
    }

    private String issuedOn(PrescriptionDTO prescription) {
        return prescription.getCreatedAt() != null
                ? prescription.getCreatedAt().format(DAY)
                : LocalDateTime.now().format(DAY);
    }

    /** Five-digit reference, so numbers line up down a printed page. */
    private String reference(Long id) {
        return id != null ? String.format("No. %05d", id) : "No. -----";
    }

    private String blankToDash(String value) {
        return (value == null || value.isBlank()) ? "-" : value;
    }
}
