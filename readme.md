# Paperbot
Semplice shop-bot per Telegram.
- Gestione dinamica prodotti e utenti.
- Completo pannello amministrativo in-line.
- Database MySQL con queries asincrone.

### Pannello principale
![main](./images/main_panel.png)

### Pannello dei prodotti
![product](./images/product_panel.png)

### Pannello per amministratori
![main](./images/admin_panel.png)

## Configurazione
1. Clona la repository.
2. Utilizza gli [script](./scripts) per creare un database MySQL.
> [!NOTE]
> Puoi usare il comando `source <persorso allo script>` nel terminale mysql del tuo database.
3. Crea nella root della repo un file `.env` strutturato cosi:
```
TOKEN=<token da BotFather>
DBHOST=<indirizzo database>
DBUSER=<username databse>
DBPWD=<password database>
DBNAME=<nome del database>
```
4. Installa le dipendenze con `npm install`.
5. Esegui l'app con `npm start` o `npm start pretty`.
