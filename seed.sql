USE campus_care;

INSERT INTO maintenance_requests
  (ticket_no, title, requester, contact_email, category, location, priority, status, details,
   approval_status, admin_result, reviewed_at)
VALUES
(7001, 'Projector will not turn on', 'Aarav Mehta', 'aarav@example.edu', 'Electrical', 'Room B-204', 'High', 'Open', 'Projector power light stays off during class.', 'Pending', '', NULL),
(7002, 'Water leak near washbasin', 'Nisha Rao', 'nisha@example.edu', 'Plumbing', 'Science Block, Floor 1', 'High', 'In Progress', 'Small leak under the sink; floor gets slippery.', 'Approved', 'Approved. A plumber has been assigned to inspect the leak.', NOW()),
(7003, 'Wi-Fi signal is weak', 'Kabir Shah', 'kabir@example.edu', 'Network', 'Library, Reading Area', 'Medium', 'Open', 'Connection drops from the back tables.', 'Pending', '', NULL),
(7004, 'Broken chair needs repair', 'Isha Kulkarni', 'isha@example.edu', 'Furniture', 'Room A-105', 'Low', 'Open', 'One chair has a loose leg.', 'Rejected', 'Please contact the department office; this item belongs to a personal classroom set.', NOW()),
(7005, 'Corridor light is flickering', 'Dev Patil', 'dev@example.edu', 'Electrical', 'Main Building, Floor 2', 'Medium', 'Open', 'Light flickers after sunset.', 'Pending', '', NULL)
ON DUPLICATE KEY UPDATE title=VALUES(title), requester=VALUES(requester), contact_email=VALUES(contact_email),
 category=VALUES(category), location=VALUES(location), priority=VALUES(priority), status=VALUES(status),
 details=VALUES(details), approval_status=VALUES(approval_status), admin_result=VALUES(admin_result),
 reviewed_at=VALUES(reviewed_at);
