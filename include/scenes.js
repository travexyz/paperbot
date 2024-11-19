const { Scenes } = require('telegraf');
const client = require('../src/client.js');
const queries = require('../src/queries.js');

const addProductScene = new Scenes.WizardScene(
    'addproduct',
    (context) => {
        context.reply("Inserisci il nome del prodotto, (\"cancel\" per annullare):");
        context.wizard.state.productInfo = {};
        return context.wizard.next();
    },
    (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        context.wizard.state.productInfo.name = context.message.text;
        context.reply(`Inserisci il prezzo per il prodotto ${context.wizard.state.productInfo.name}:`);
        return context.wizard.next();
    },
    (context) => {
        context.wizard.state.productInfo.price = context.message.text;
        context.reply(`Inserisci la quantità di ${context.wizard.state.productInfo.name} (-1 infinito, 0 terminato):`);
        return context.wizard.next();
    }, (context) => {
        context.wizard.state.productInfo.stock = context.message.text;
        context.reply("Vuoi nascondere o mostrare il prodotto nella lista? 0 nascondi, 1 mostra");
        return context.wizard.next();
    }, async (context) => {
        context.wizard.state.productInfo.visible = (context.message.text === "1");
        const { name, price, stock, visible } = context.wizard.state.productInfo;
        try {
            await queries.addProduct(name, price, stock, visible, context.from.username);
        } catch (err) {
            context.reply("Errore nell'aggiunta del prodotto.");
        } finally {
            context.reply('Prodotto aggiunto!');
        }
        return context.scene.leave();
    },
);

const editNameScene = new Scenes.WizardScene(
    'editname',
    (context) => {
        context.reply("Inserisci il nuovo nome del prodotto (\"cancel\" per annullare):");
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.updateProductName(context.session.__scenes.state.productId, context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nella modifica del nome del prodotto.");
        } finally {
            context.reply(`Modificato nome del prodotto in ${context.message.text}`);
        }
        return context.scene.leave();
    },
);

const editPriceScene = new Scenes.WizardScene(
    'editprice',
    (context) => {
        context.reply("Inserisci il nuovo prezzo del prodotto (\"cancel\" per annullare):");
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.updateProductPrice(context.session.__scenes.state.productId, context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nella modifica del prezzo del prodotto.");
        } finally {
            context.reply(`Modificato prezzo del prodotto in ${context.message.text}`);
        }
        return context.scene.leave();
    },
);

const editStockScene = new Scenes.WizardScene(
    'editstock',
    (context) => {
        context.reply("Inserisci la nuova quantità del prodotto (-1 infinito, 0 terminato) (\"cancel\" per annullare):");
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.updateProductStock(context.session.__scenes.state.productId, context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nella modifica della quantità del prodotto.");
        } finally {
            context.reply(`Modificata quantità del prodotto in ${context.message.text}`);
        }
        return context.scene.leave();
    },
);

const addAdminScene = new Scenes.WizardScene(
    'addadmin',
    (context) => {
        context.reply("Inserisci l'ID dell'amministratore da aggiungere (\"cancel\" per annullare):");
        return context.wizard.next();
    }, (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        context.wizard.state.id = context.message.text;
        client.telegram.getChat(context.wizard.state.id)
            .then(chat => {
                context.reply(`Sei sicuro di voler aggiungere ${chat.username} ID: ${context.wizard.state.id} alla lista di amministratori? (0 no, 1 si)`);
            })
            .catch(_err => {
                context.reply(`Impossibile trovare l'utente, verifica che l'ID (non l'username) sia corretto. Riprova.`);
                context.scene.leave();
            });
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "1") {
            try {
                await queries.addAdmin(context.wizard.state.id, context.from.username);
            } catch (err) {
                context.reply("Errore nell'aggiunta dell'amministratore.");
            } finally {
                context.reply(`Utente aggiunto alla lista degli amministratori!`);
            }
        } else {
            context.reply('OK, utente non aggiunto!');
        }
        return context.scene.leave();
    },
);

const editMotdScene = new Scenes.WizardScene(
    'editmotd',
    (context) => {
        context.reply("Inserisci il nuovo Messaggio del Giorno da visualizzare (\"cancel\" per annullare):");
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.updateMotd(context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nella modifica del Messaggio del Giorno.");
        } finally {
            context.reply(`Nuovo Messaggio del Giorno impostato!`);
        }
        return context.scene.leave();
    },
);

const editShopNameScene = new Scenes.WizardScene(
    'editshopname',
    (context) => {
        context.reply("Inserisci il nuovo nome dello shop da visualizzare (\"cancel\" per annullare):");
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.updateShopName(context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nella modifica del nome dello shop.");
        } finally {
            context.reply(`Nuovo nome shop impostato!`);
        }
        return context.scene.leave();
    },
);

const setCreditScene = new Scenes.WizardScene(
    'setcredit',
    async (context) => {
        const Users = await queries.getUsers();
        var user = Users.find(user => user.id === parseInt(context.session.__scenes.state.id));
        var username;
        await client.telegram.getChat(user.telegramID)
            .then(chat => username = chat.username);

        context.reply(`Inserisci il credito da impostare all'utente ${username} ID: ${user.telegramID} ("cancel" per annullare):`);
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        var credit = context.message.text;
        try {
            await queries.setUserCredit(context.session.__scenes.state.id, credit, context.from.username);
        } catch (err) {
            context.reply("Errore nell'impostare il credito.");
        } finally {
            context.reply(`Credito dell'utente impostato a ${credit}`);
        }
        return context.scene.leave();
    }
);

const addCreditScene = new Scenes.WizardScene(
    'addcredit',
    async (context) => {
        const Users = await queries.getUsers();
        var user = Users.find(user => user.id == context.session.__scenes.state.id);
        var username;
        await client.telegram.getChat(user.telegramID)
            .then(chat => username = chat.username);

        context.reply(`Inserisci il credito da aggiungere all'utente ${username} ID: ${user.telegramID} ("cancel" per annullare):`);
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.addUserCredit(context.session.__scenes.state.id, context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nell'aggiunta del credito.");
        } finally {
            const Users = await queries.getUsers();
            var user = Users.find(user => user.id == context.session.__scenes.state.id);
            context.reply(`Credito dell'utente dopo l'aggiunta: ${user.balance}`);
        }
        return context.scene.leave();
    }
);

const rmCreditScene = new Scenes.WizardScene(
    'rmcredit',
    async (context) => {
        const Users = await queries.getUsers();
        var user = Users.find(user => user.id == context.session.__scenes.state.id);
        var username;
        await client.telegram.getChat(user.telegramID)
            .then(chat => username = chat.username);

        context.reply(`Inserisci il credito da rimuovere all'utente ${username} ID: ${user.telegramID} ("cancel" per annullare):`);
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.removeUserCredit(context.session.__scenes.state.id, context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nella rimozione del credito.");
        } finally {
            const Users = await queries.getUsers();
            var user = Users.find(user => user.id == context.session.__scenes.state.id);
            context.reply(`Credito dell'utente dopo la rimozione: ${user.balance}`);
        }
        return context.scene.leave();
    }
);

const broadcastScene = new Scenes.WizardScene(
    'broadcast',
    (context) => {
        context.reply("Inserisci il messaggio che vuoi mandare a tutti gli utenti del bot (\"cancel\" per annullare):");
        return context.wizard.next();
    }, async (context) => {
        if (context.message.text === "cancel") {
            await context.reply("Operazione annullata.");
            return context.scene.leave();
        }
        try {
            await queries.broadcastMessage(context.message.text, context.from.username);
        } catch (err) {
            context.reply("Errore nell'invio del messaggio.");
        } finally {
            await context.reply("Messaggio mandato! Dovresti vederlo anche te qua sopra.");
        }
        return context.scene.leave();
    }
);

module.exports = {
    addProductScene,
    editNameScene,
    editPriceScene,
    editStockScene,
    addAdminScene,
    editMotdScene,
    editShopNameScene,
    setCreditScene,
    addCreditScene,
    rmCreditScene,
    broadcastScene
};