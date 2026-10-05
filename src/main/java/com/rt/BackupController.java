package com.rt; // <-- CHANGE THIS to match your other controllers!

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/backup")
@CrossOrigin(origins = "*")
public class BackupController {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    // Automatically extracts the database name from jdbc:mysql://localhost:3306/your_db_name
    private String extractDbName() {
        String cleanUrl = dbUrl.split("\\?")[0];
        return cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
    }

    // Automatically finds mysqldump / mysql on Windows or Linux
    private String resolveExecutable(String toolName) {
        String[] commonWinPaths = {
            "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\" + toolName + ".exe",
            "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\" + toolName + ".exe",
            "C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\" + toolName + ".exe",
            "C:\\xampp\\mysql\\bin\\" + toolName + ".exe"
        };
        for (String path : commonWinPaths) {
            if (new File(path).exists()) {
                return path;
            }
        }
        return toolName; // Fallback to system PATH (Linux / configured Windows)
    }

    /**
     * 1. GENERATE & DOWNLOAD FULL SQL BACKUP (.sql)
     */
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadBackup() {
        try {
            String dbName = extractDbName();
            String dumpTool = resolveExecutable("mysqldump");

            List<String> command = new ArrayList<>();
            command.add(dumpTool);
            command.add("-u");
            command.add(dbUser);
            if (dbPassword != null && !dbPassword.isEmpty()) {
                command.add("-p" + dbPassword);
            }
            command.add("--add-drop-table");
            command.add("--routines");
            command.add("--events");
            command.add("--single-transaction");
            command.add(dbName);

            ProcessBuilder pb = new ProcessBuilder(command);
            Process process = pb.start();

            ByteArrayOutputStream sqlOutput = new ByteArrayOutputStream();
            try (InputStream is = process.getInputStream()) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    sqlOutput.write(buffer, 0, read);
                }
            }

            // Capture error stream in case mysqldump fails
            ByteArrayOutputStream errorOutput = new ByteArrayOutputStream();
            try (InputStream es = process.getErrorStream()) {
                byte[] buffer = new byte[4096];
                int read;
                while ((read = es.read(buffer)) != -1) {
                    errorOutput.write(buffer, 0, read);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String errMsg = errorOutput.toString(StandardCharsets.UTF_8);
                System.err.println("mysqldump error: " + errMsg);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(("Backup failed: " + errMsg).getBytes(StandardCharsets.UTF_8));
            }

            String timestamp = new SimpleDateFormat("dd-MMM-yyyy_HH-mm").format(new Date());
            String filename = "RetailerApp_Backup_" + timestamp + ".sql";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/sql"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(sqlOutput.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Server error: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * 2. UPLOAD & RESTORE FULL SQL BACKUP (.sql)
     */
    @PostMapping("/restore")
    public ResponseEntity<String> restoreBackup(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a valid .sql backup file.");
        }

        File tempFile = null;
        try {
            String dbName = extractDbName();
            String mysqlTool = resolveExecutable("mysql");

            tempFile = File.createTempFile("erp_restore_", ".sql");
            file.transferTo(tempFile);

            List<String> command = new ArrayList<>();
            command.add(mysqlTool);
            command.add("-u");
            command.add(dbUser);
            if (dbPassword != null && !dbPassword.isEmpty()) {
                command.add("-p" + dbPassword);
            }
            command.add(dbName);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectInput(tempFile);
            Process process = pb.start();

            ByteArrayOutputStream errorOutput = new ByteArrayOutputStream();
            try (InputStream es = process.getErrorStream()) {
                byte[] buffer = new byte[4096];
                int read;
                while ((read = es.read(buffer)) != -1) {
                    errorOutput.write(buffer, 0, read);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                return ResponseEntity.ok("Database restored successfully!");
            } else {
                String errMsg = errorOutput.toString(StandardCharsets.UTF_8);
                System.err.println("mysql restore error: " + errMsg);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Restore failed: " + errMsg);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error during restore: " + e.getMessage());
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}