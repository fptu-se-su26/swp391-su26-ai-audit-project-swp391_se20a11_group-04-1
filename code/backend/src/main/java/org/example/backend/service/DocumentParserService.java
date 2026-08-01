package org.example.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class DocumentParserService {

    // Hard limit on extracted text to prevent OOM downstream
    private static final int MAX_TEXT_CHARS = 12_000;

    public String parseDocument(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("Tên file không hợp lệ.");
        }
        
        String extension = getExtension(filename).toLowerCase();
        try {
            String text;
            if (extension.equals("pdf")) {
                text = parsePdf(file);
            } else if (extension.equals("docx")) {
                text = parseDocx(file);
            } else {
                throw new RuntimeException("Định dạng file không được hỗ trợ. Vui lòng upload .pdf hoặc .docx");
            }
            // Truncate early to prevent OOM in downstream AI processing
            if (text != null && text.length() > MAX_TEXT_CHARS) {
                return text.substring(0, MAX_TEXT_CHARS);
            }
            return text;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi đọc file " + filename + ": " + e.getMessage(), e);
        }
    }

    private String parsePdf(MultipartFile file) throws Exception {
        // Use RandomAccessReadBuffer to avoid readAllBytes() double memory usage
        try (InputStream is = file.getInputStream();
             org.apache.pdfbox.io.RandomAccessReadBuffer buffer = new org.apache.pdfbox.io.RandomAccessReadBuffer(is);
             PDDocument document = Loader.loadPDF(buffer)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String parseDocx(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf(".");
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1);
        }
        return "";
    }
}
