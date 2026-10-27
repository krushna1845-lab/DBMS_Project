-- Run this once only if campus_care was created from the earlier project schema.
USE campus_care;

ALTER TABLE maintenance_requests
  ADD COLUMN contact_email VARCHAR(254) NOT NULL DEFAULT '' AFTER requester,
  ADD COLUMN approval_status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending' AFTER details,
  ADD COLUMN admin_result VARCHAR(500) NOT NULL DEFAULT '' AFTER approval_status,
  ADD COLUMN reviewed_at DATETIME NULL AFTER admin_result,
  ADD INDEX idx_requests_approval_status (approval_status);
