

CREATE DATABASE IF NOT EXISTS appointmentspe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS appointmentscl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE appointmentspe; 

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId VARCHAR(36) NOT NULL UNIQUE,
    insuredId VARCHAR(5) NOT NULL,
    scheduleId INT NOT NULL,
    centerId INT NULL,
    specialtyId INT NULL,
    medicId INT NULL,
    appointmentDate DATETIME NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_insuredId (insuredId),
    INDEX idx_appointmentId (appointmentId),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scheduleId INT NOT NULL UNIQUE,
    centerId INT NOT NULL,
    specialtyId INT NOT NULL,
    medicId INT NOT NULL,
    appointmentDate DATETIME NOT NULL,
    isAvailable BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_scheduleId (scheduleId),
    INDEX idx_availability (isAvailable, appointmentDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schedules (scheduleId, centerId, specialtyId, medicId, appointmentDate, isAvailable) VALUES
(100, 1, 1, 1, '2024-12-15 09:00:00', TRUE),
(101, 1, 1, 1, '2024-12-15 10:00:00', TRUE),
(102, 1, 2, 2, '2024-12-15 11:00:00', TRUE),
(103, 2, 1, 3, '2024-12-16 09:00:00', TRUE),
(104, 2, 3, 4, '2024-12-16 14:00:00', TRUE);