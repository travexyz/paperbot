const { Scenes } = require('telegraf');
const client = require('../config/clientConfig');
const queries = require('../config/database/dbQueries');

const addProductScene = new Scenes.WizardScene(
    'addproduct',
    (Context) => {
        Context.reply("Inserisci il nome del prodotto, (\"cancel\" per annullare):");
        Context.wizard.state.productInfo = {};
        return Context.wizard.next();
    },
    (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        Context.wizard.state.productInfo.name = Context.message.text;
        Context.reply(`Inserisci il prezzo per il prodotto ${Context.wizard.state.productInfo.name}:`);
        return Context.wizard.next();
    },
    (Context) => {
        Context.wizard.state.productInfo.price = Context.message.text;
        Context.reply(`Inserisci la quantità di ${Context.wizard.state.productInfo.name} (-1 infinito, 0 terminato):`);
        return Context.wizard.next();
    }, (Context) => {
        Context.wizard.state.productInfo.stock = Context.message.text;
        Context.reply("Vuoi nascondere o mostrare il prodotto nella lista? 0 nascondi, 1 mostra");
        return Context.wizard.next();
    }, async (Context) => {
        Context.wizard.state.productInfo.visible = (Context.message.text === "1");
        const { name, price, stock, visible } = Context.wizard.state.productInfo;
        try {
            await queries.addProduct(name, price, stock, visible, Context.from.username);
        } catch (err) {
            Context.reply("Errore nell'aggiunta del prodotto.");
        } finally {
            Context.reply('Prodotto aggiunto!');
        }
        return Context.scene.leave();
    },
);

const editNameScene = new Scenes.WizardScene(
    'editname',
    (Context) => {
        Context.reply("Inserisci il nuovo nome del prodotto (\"cancel\" per annullare):");
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.updateProductName(Context.session.__scenes.state.productId, Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nella modifica del nome del prodotto.");
        } finally {
            Context.reply(`Modificato nome del prodotto in ${Context.message.text}`);
        }
        return Context.scene.leave();
    },
);

const editPriceScene = new Scenes.WizardScene(
    'editprice',
    (Context) => {
        Context.reply("Inserisci il nuovo prezzo del prodotto (\"cancel\" per annullare):");
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.updateProductPrice(Context.session.__scenes.state.productId, Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nella modifica del prezzo del prodotto.");
        } finally {
            Context.reply(`Modificato prezzo del prodotto in ${Context.message.text}`);
        }
        return Context.scene.leave();
    },
);

const editStockScene = new Scenes.WizardScene(
    'editstock',
    (Context) => {
        Context.reply("Inserisci la nuova quantità del prodotto (-1 infinito, 0 terminato) (\"cancel\" per annullare):");
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.updateProductStock(Context.session.__scenes.state.productId, Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nella modifica della quantità del prodotto.");
        } finally {
            Context.reply(`Modificata quantità del prodotto in ${Context.message.text}`);
        }
        return Context.scene.leave();
    },
);

const addAdminScene = new Scenes.WizardScene(
    'addadmin',
    (Context) => {
        Context.reply("Inserisci l'ID dell'amministratore da aggiungere (\"cancel\" per annullare):");
        return Context.wizard.next();
    }, (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        Context.wizard.state.id = Context.message.text;
        client.telegram.getChat(Context.wizard.state.id)
            .then(chat => {
                Context.reply(`Sei sicuro di voler aggiungere ${chat.username} ID: ${Context.wizard.state.id} alla lista di amministratori? (0 no, 1 si)`);
            })
            .catch(_err => {
                Context.reply(`Impossibile trovare l'utente, verifica che l'ID (non l'username) sia corretto. Riprova.`);
                Context.scene.leave();
            });
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "1") {
            try {
                await queries.addAdmin(Context.wizard.state.id, Context.from.username);
            } catch (err) {
                Context.reply("Errore nell'aggiunta dell'amministratore.");
            } finally {
                Context.reply(`Utente aggiunto alla lista degli amministratori!`);
            }
        } else {
            Context.reply('OK, utente non aggiunto!');
        }
        return Context.scene.leave();
    },
);

const editMotdScene = new Scenes.WizardScene(
    'editmotd',
    (Context) => {
        Context.reply("Inserisci il nuovo Messaggio del Giorno da visualizzare (\"cancel\" per annullare):");
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.updateMotd(Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nella modifica del Messaggio del Giorno.");
        } finally {
            Context.reply(`Nuovo Messaggio del Giorno impostato!`);
        }
        return Context.scene.leave();
    },
);

const editShopNameScene = new Scenes.WizardScene(
    'editshopname',
    (Context) => {
        Context.reply("Inserisci il nuovo nome dello shop da visualizzare (\"cancel\" per annullare):");
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.updateShopName(Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nella modifica del nome dello shop.");
        } finally {
            Context.reply(`Nuovo nome shop impostato!`);
        }
        return Context.scene.leave();
    },
);

const setCreditScene = new Scenes.WizardScene(
    'setcredit',
    async (Context) => {
        const Users = await queries.getUsers(Context.from.id);
        var user = Users.find(user => user.id === parseInt(Context.session.__scenes.state.id));
        var username;
        await client.telegram.getChat(user.telegramID)
            .then(chat => username = chat.username);

        Context.reply(`Inserisci il credito da impostare all'utente ${username} ID: ${user.telegramID} ("cancel" per annullare):`);
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        var credit = Context.message.text;
        try {
            await queries.setUserCredit(Context.session.__scenes.state.id, credit, Context.from.username);
        } catch (err) {
            Context.reply("Errore nell'impostare il credito.");
        } finally {
            Context.reply(`Credito dell'utente impostato a ${credit}`);
        }
        return Context.scene.leave();
    }
);

const addCreditScene = new Scenes.WizardScene(
    'addcredit',
    async (Context) => {
        const Users = await queries.getUsers(Context.from.id);
        var user = Users.find(user => user.id == Context.session.__scenes.state.id);
        var username;
        await client.telegram.getChat(user.telegramID)
            .then(chat => username = chat.username);

        Context.reply(`Inserisci il credito da aggiungere all'utente ${username} ID: ${user.telegramID} ("cancel" per annullare):`);
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.addUserCredit(Context.session.__scenes.state.id, Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nell'aggiunta del credito.");
        } finally {
            const Users = await queries.getUsers(Context.from.id);
            var user = Users.find(user => user.id == Context.session.__scenes.state.id);
            Context.reply(`Credito dell'utente dopo l'aggiunta: ${user.balance}`);
        }
        return Context.scene.leave();
    }
);

const rmCreditScene = new Scenes.WizardScene(
    'rmcredit',
    async (Context) => {
        const Users = await queries.getUsers(Context.from.id);
        var user = Users.find(user => user.id == Context.session.__scenes.state.id);
        var username;
        await client.telegram.getChat(user.telegramID)
            .then(chat => username = chat.username);

        Context.reply(`Inserisci il credito da rimuovere all'utente ${username} ID: ${user.telegramID} ("cancel" per annullare):`);
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.removeUserCredit(Context.session.__scenes.state.id, Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nella rimozione del credito.");
        } finally {
            const Users = await queries.getUsers(Context.from.id);
            var user = Users.find(user => user.id == Context.session.__scenes.state.id);
            Context.reply(`Credito dell'utente dopo la rimozione: ${user.balance}`);
        }
        return Context.scene.leave();
    }
);

const broadcastScene = new Scenes.WizardScene(
    'broadcast',
    (Context) => {
        Context.reply("Inserisci il messaggio che vuoi mandare a tutti gli utenti del bot (\"cancel\" per annullare):");
        return Context.wizard.next();
    }, async (Context) => {
        if (Context.message.text === "cancel") {
            await Context.reply("Operazione annullata.");
            return Context.scene.leave();
        }
        try {
            await queries.broadcastMessage(Context.message.text, Context.from.username);
        } catch (err) {
            Context.reply("Errore nell'invio del messaggio.");
        } finally {
            await Context.reply("Messaggio mandato! Dovresti vederlo anche te qua sopra.");
        }
        return Context.scene.leave();
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