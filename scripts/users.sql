-- Usa il database
USE paperbot;

-- Crea la tabella 'user'
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,             -- ID utente, chiave primaria, auto incremento
    `balance` INT NOT NULL DEFAULT 0,                         -- Bilancio, valore di default 0
    `banned` BOOLEAN NOT NULL DEFAULT FALSE,                  -- Stato banned, valore di default false
    `admin` BOOLEAN NOT NULL DEFAULT FALSE,                   -- Stato admin, valore di default false
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- Data di creazione, valore di default corrente
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,                        -- Data di aggiornamento, valore corrente con update automatico
    `telegramID` BIGINT UNSIGNED NOT NULL,                       -- ID Telegram, unsigned e non nullo
    `pisello` TINYINT UNSIGNED DEFAULT NULL                   -- Colonna pisello, unsigned con valore di default NULL
);

-- Visualizza la struttura della tabella per verificarla
DESCRIBE `users`;
