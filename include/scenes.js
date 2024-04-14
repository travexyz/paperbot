// File: scenes.js
// Descrizione: File contenente tutte le scene del bot
// Autore: travexyz

const {
    Telegraf, Markup, Scenes, session
} = require('telegraf')

const addProduct = new Scenes.WizardScene(
    'addproduct',
    (ctx) => {
        ctx.reply("Inserisci il nome del prodotto:")
        productInfo = {}
        return ctx.wizard.next()
    },
    (ctx) => {
        productInfo.name = ctx.message.text
        ctx.reply(`Inserisci il prezzo per il prodotto ${productInfo.name}:`)
        return ctx.wizard.next()
    },
    (ctx) => {
        productInfo.price = ctx.message.text
        ctx.reply(`Inserisci la quantità di ${productInfo.name} (-1 infinito, 0 terminato):`)
        return ctx.wizard.next()
    }, (ctx) => {
        productInfo.stock = ctx.message.text
        ctx.reply("Vuoi nascondere o mostrare il prodotto nella lista? (0 nascondi, 1 mostra)")
        return ctx.wizard.next()
    }, async (ctx) => {
        productInfo.visible = (ctx.message.text == "0") ? true : false
        await pool.query(`INSERT INTO products (name, price, stock, visible) VALUES (?, ?, ?, ?)`, [`${productInfo.name}`, productInfo.price, productInfo.stock, ((productInfo.visible) ? 1 : 0)])
        if (debug) console.warn(`${Date.now()} product added. product name: ${productInfo.name}`)
        ctx.reply(`Prodotto aggiunto!`)
        return ctx.scene.leave()
    },
)

const editName = new Scenes.WizardScene(
    'editname',
    (ctx) => {
        ctx.reply("Inserisci il nuovo nome del prodotto:")// 
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE products SET name=? WHERE id=?`, [`${ctx.message.text}`, `${ctx.session.__scenes.state.productId}`])
        if (debug) console.warn(`${Date.now()} product name changed (${ctx.message.text}). victim product key: ${ctx.session.__scenes.state.productId}`)
        ctx.reply(`Modificato nome del prodotto in ${ctx.message.text}`)
        return ctx.scene.leave()
    },
)

const editPrice = new Scenes.WizardScene(
    'editprice',
    (ctx) => {
        ctx.reply("Inserisci il nuovo prezzo del prodotto:")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE products SET price=? WHERE id=?`, [`${ctx.message.text}`, `${ctx.session.__scenes.state.productId}`])
        if (debug) console.warn(`${Date.now()} product price changed (${ctx.message.text}). victim product key: ${ctx.session.__scenes.state.productId}`)
        ctx.reply(`Modificato prezzo del prodotto in ${ctx.message.text}`)
        return ctx.scene.leave()
    },
)

const editStock = new Scenes.WizardScene(
    'editstock',
    (ctx) => {
        ctx.reply("Inserisci la nuova quantità del prodotto (-1 infinito, 0 terminato):")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE products SET stock=? WHERE id=?`, [`${ctx.message.text}`, `${ctx.session.__scenes.state.productId}`])
        if (debug) console.warn(`${Date.now()} product stock changed (${ctx.message.text}). victim product key: ${ctx.session.__scenes.state.productId}`)
        ctx.reply(`Modificata quantità del prodotto in ${ctx.message.text}`)
        return ctx.scene.leave()
    },
)

const addAdmin = new Scenes.WizardScene(
    'addadmin',
    (ctx) => {
        ctx.reply("Inserisci l'ID dell'amministratore da aggiungere:")
        return ctx.wizard.next()
    },
    (ctx) => {
        id = ctx.message.text
        client.telegram.getChat(id)
            .then(chat => { ctx.reply(`Sei sicuro di voler aggiungere ${chat.username} (${id}) alla lista di amministratori? (0 no, 1 si)`) })
            .catch(err => { ctx.reply(`Impossibile trovare l'utente, verifica che l'ID (non l'username) sia corretto! Esco.`, { parse_mode: 'HTML' }); ctx.scene.leave() })
        return ctx.wizard.next()
    }, async (ctx) => {
        if (ctx.message.text == "1") {
            await pool.query(`UPDATE users SET admin=TRUE WHERE id=?`, [id])
            if (debug) console.warn(`${Date.now()} user added as admin. victim user key: ${id}`)
            ctx.reply(`Utente aggiunto alla lista degli amministratori!`)
        } else {
            ctx.reply(`OK, utente NON aggiunto!`)
        }
        return ctx.scene.leave()
    },
)

const editMotd = new Scenes.WizardScene(
    'editmotd',
    (ctx) => {
        ctx.reply("Inserisci il nuovo Messaggio del Giorno da visualizzare:")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE config SET motd=?`, [`${ctx.message.text}`])
        if (debug) console.warn(`${Date.now()} motd edited in "${ctx.message.text}". author user telegram id ${ctx.from.id}`)
        ctx.reply(`Nuovo Messaggio del Giorno impostato!`)
        return ctx.scene.leave()
    },
)

const editShopName = new Scenes.WizardScene(
    'editshopname',
    (ctx) => {
        ctx.reply("Inserisci il nuovo nome dello shop da visualizzare:")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE config SET shopname=?`, [`${ctx.message.text}`])
        if (debug) console.warn(`${Date.now()} shopname edited in "${ctx.message.text}". author user telegram id ${ctx.from.id}`)
        ctx.reply(`Nuovo nome shop impostato!`)
        return ctx.scene.leave()
    },
)

const setCredit = new Scenes.WizardScene(
    'setcredit',
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == parseInt(ctx.session.__scenes.state.id))
        var username
        await client.telegram.getChat(user.userID)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da impostare all'utente ${username} (${user.userID}):`)
        return ctx.wizard.next()
    },
    async (ctx) => {
        var credit = ctx.message.text
        await pool.query(`UPDATE users SET balance=? WHERE id=?`, [parseFloat(credit), ctx.session.__scenes.state.id])
        if (debug) console.warn(`${Date.now()} user credit changed to ${parseFloat(credit)}. victim user key: ${ctx.session.__scenes.state.id}, author user telegram id: ${ctx.from.id}`)
        ctx.reply(`Credito dell'utente impostato a ${credit}`)
        return ctx.scene.leave()
    }
)

const addCredit = new Scenes.WizardScene(
    'addcredit',
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var username
        await client.telegram.getChat(user.userID)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da aggiungere all'utente ${username} (${user.userID}):`)
        return ctx.wizard.next()
    },
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var credit = user.balance + (parseFloat(ctx.message.text))
        await pool.query(`UPDATE users SET balance=? WHERE id=?`, [credit, ctx.session.__scenes.state.id])
        if (debug) console.warn(`${Date.now()} user credit changed (${parseFloat(credit)}). victim user key: ${ctx.session.__scenes.state.id}, author user telegram id: ${ctx.from.id}`)
        ctx.reply(`Credito dell'utente dopo l'aggiunta: ${credit}`)
        return ctx.scene.leave()
    }
)

const rmCredit = new Scenes.WizardScene(
    'rmcredit',
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var username
        await client.telegram.getChat(user.userID)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da rimuovere all'utente ${username} (${user.userID}):`)
        return ctx.wizard.next()
    },
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var credit = user.balance - (parseFloat(ctx.message.text))
        await pool.query(`UPDATE users SET balance=? WHERE id=?`, [credit, ctx.session.__scenes.state.id])
        if (debug) console.warn(`${Date.now()} user credit changed (${parseFloat(credit)}). victim user key: ${ctx.session.__scenes.state.id}, author user telegram id: ${ctx.from.id}`)
        ctx.reply(`Credito dell'utente dopo la rimozione: ${credit}`)
        return ctx.scene.leave()
    }
)

const broadcast = new Scenes.WizardScene(
    'broadcast',
    (ctx) => {
        ctx.reply("Inserisci il messaggio che vuoi mandare a tutti gli utenti del bot:")
        return ctx.wizard.next()
    }, async (ctx) => {
        const Users = (await getUsers())[0]
        Users.forEach(user => {
            client.telegram.sendMessage(user.userID, ctx.message.text)
        })
        if (debug) console.warn(`${Date.now()} broadcasted message "${ctx.message.text}", author user telegram id ${ctx.from.id}`)
        ctx.reply("Messaggio mandato! Dovresti vederlo anche te qua sopra.")
        return ctx.scene.leave()
    }
)

module.exports = { addProduct, editName, editPrice, editStock, addAdmin, editMotd, editShopName, setCredit, addCredit, rmCredit, broadcast }