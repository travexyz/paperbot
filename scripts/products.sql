-- Usa il database
USE paperbot;

-- Crea la tabella 'products'
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,              -- ID prodotto, chiave primaria, auto incremento
    `name` VARCHAR(255) NOT NULL,                              -- Nome prodotto, non nullo
    `price` INT NOT NULL,                                  -- Prezzo, non nullo
    `stock` INT NOT NULL DEFAULT 0,                            -- Quantità in stock, valore di default 0
    `visible` BOOLEAN NOT NULL DEFAULT TRUE,                   -- Visibilità del prodotto, valore di default true
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- Data di creazione, valore di default corrente
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP                           -- Data di aggiornamento, valore corrente con update automatico
);

-- Visualizza la struttura della tabella per verificarla
DESCRIBE `products`;
