-- Usa il database precedentemente creato
USE paperbot;

-- Crea la tabella 'config'
CREATE TABLE IF NOT EXISTS `config` (
    `shopname` VARCHAR(255) NOT NULL DEFAULT 'Paper',         -- Nome del negozio, valore di default 'Paper'
    `currency` CHAR(8) NOT NULL DEFAULT '€',                 -- Valuta, valore di default '€'
    `motd` VARCHAR(255) DEFAULT NULL                          -- Messaggio del giorno, valore di default NULL
    `shopLockdown` BOOLEAN NOT NULL DEFAULT FALSE,           -- Stato del negozio, false: accessibile, true: bloccato agli user
);

-- Visualizza la struttura della tabella per verificarla
DESCRIBE `config`;
