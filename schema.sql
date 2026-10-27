CREATE DATABASE IF NOT EXISTS campus_care
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE campus_care;

CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INT NOT NULL AUTO_INCREMENT,
    ticket_no INT NOT NULL,
    title VARCHAR(120) NOT NULL,
    requester VARCHAR(100) NOT NULL,
    contact_email VARCHAR(254) NOT NULL,
    category VARCHAR(60) NOT NULL,
    location VARCHAR(100) NOT NULL,
    priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Open',
    details VARCHAR(500) NOT NULL DEFAULT '',
    approval_status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    admin_result VARCHAR(500) NOT NULL DEFAULT '',
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_requests_ticket_no (ticket_no),
    INDEX idx_requests_category (category),
    INDEX idx_requests_status (status),
    INDEX idx_requests_priority (priority),
    INDEX idx_requests_approval_status (approval_status)
);
