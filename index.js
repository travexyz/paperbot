// #region Envoirment Configuation
require('dotenv').config()
const { writeFileSync } = require('fs')
var Config = require("./config/config.json")
var Products = require("./config/products.json")
var Users = require("./config/users.json")
// #endregion

// #region Bot Configuration
const {
    Telegraf, Markup, Scenes, session
} = require('telegraf')

const client = new Telegraf(process.env.TOKEN)
client.catch((err) => {
    console.error(err)
    Config.administrators.forEach(id => {
        client.telegram.sendMessage(id, `Error Occurred: \`\`\`${err}\`\`\``, { parse_mode: "MarkdownV2" })
    })
})

const updateLocal = _ => {
    writeFileSync("./config/config.json", JSON.stringify(Config))
    writeFileSync("./config/products.json", JSON.stringify(Products))
    writeFileSync("./config/users.json", JSON.stringify(Users))
}
// #endregion

//#region Wizards
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
        ctx.reply(`Inserisci la quantità di ${productInfo.name}:`)
        return ctx.wizard.next()
    }, (ctx) => {
        productInfo.stock = ctx.message.text
        ctx.reply("Vuoi nascondere il prodotto dalla lista? (1 si, 0 no)")
        return ctx.wizard.next()
    }, (ctx) => {
        productInfo.hidden = (ctx.message.text == "1") ? true : false
        Products.push(productInfo)
        updateLocal()
        ctx.reply(`Aggiunto prodotto ${productInfo.name} (x${productInfo.stock}) al prezzo di ${productInfo.price}!`)
        return ctx.scene.leave()
    },
)
const editName = new Scenes.WizardScene(
    'editname',
    (ctx) => {
        ctx.reply("Inserisci il nuovo nome del prodotto:")
        return ctx.wizard.next()
    }, (ctx) => {
        Products[ctx.session.product].name = ctx.message.text
        updateLocal()
        ctx.reply(`Modificato nome del prodotto in ${Products[ctx.session.product].name}`)
        return ctx.scene.leave()
    },
)

const editPrice = new Scenes.WizardScene(
    'editprice',
    (ctx) => {
        ctx.reply("Inserisci il nuovo prezzo del prodotto:")
        return ctx.wizard.next()
    }, (ctx) => {
        Products[ctx.session.product].price = ctx.message.text
        updateLocal()
        ctx.reply(`Modificato prezzo del prodotto in ${Products[ctx.session.product].price}`)
        return ctx.scene.leave()
    },
)

const editStock = new Scenes.WizardScene(
    'editstock',
    (ctx) => {
        ctx.reply("Inserisci la nuova quantità del prodotto:")
        return ctx.wizard.next()
    }, (ctx) => {
        Products[ctx.session.product].stock = ctx.message.text
        updateLocal()
        ctx.reply(`Modificata quantità del prodotto in ${Products[ctx.session.product].stock}`)
        return ctx.scene.leave()
    },
)

const editVis = new Scenes.WizardScene(
    'editvis',
    (ctx) => {
        ctx.reply("Vuoi nascondere (1) o mostrare (0) il prodotto:")
        return ctx.wizard.next()
    }, (ctx) => {
        Products[ctx.session.product].hidden = (ctx.message.text == "1") ? true : false
        updateLocal()
        ctx.reply(`Modificata visibilità del prodotto in ${Products[ctx.session.product].hidden}`)
        return ctx.scene.leave()
    },
)

client.use(session());
client.use(new Scenes.Stage([addProduct, editName, editPrice, editStock, editVis]));
//#endregion

// #region Start Command
client.start(async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return

    updateLocal()

    Context.reply(`<b>${Config.shopName} Bot - Developed by <span class="tg-spoiler">@AnonHexo</span></b>`, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([[Markup.button.callback("👽 Enter Shop", "main")]])
    })
})
// #endregion

// #region Bot Actions
client.action("main", async (Context) => {
    await Context.editMessageText(`Wassup <b>${Context.from.username}</b>, welcome to <b>${Config.shopName}!</b>\n
💵 Balance: <code>${Users.find(usr => usr.id == Context.from.id).balance}$</code>
🛒 Cart itmes: <code>${Users.find(usr => usr.id == Context.from.id).cart.length}</code>`, { parse_mode: 'HTML' })

    if (Config.administrators.includes(Context.from.id)) {
        await Context.editMessageReplyMarkup({
            inline_keyboard: [
                [Markup.button.callback("📚 Products", "products")],

                [Markup.button.callback("🪪 Account", "account"),
                Markup.button.callback("ℹ️ Info", "info")],

                [Markup.button.callback("🛠️ Panel", "panel")]
            ],
        })
    } else {
        await Context.editMessageReplyMarkup({
            inline_keyboard: [
                [Markup.button.callback("📚 Products", "products")],

                [Markup.button.callback("🪪 Account", "account"),
                Markup.button.callback("ℹ️ Info", "info")],
            ],
        })
    }

})
//#endregion

// #region Menu Actions
client.action("products", async (Context) => {
    let message = `📚 <b>${Config.shopName} Products:</b>\n\n`
    Products.forEach(item => {
        if (item.hidden) return

        let stock = item.stock
        if (item.stock == 0) {
            stock = "SOLD OUT"
        } else if (item.stock == -1) {
            stock = "UNLIMITED"
        }
        message += ` <b>${item.name}:</b>\n<b>💸 Price:</b> <code>${item.price}$</code>\n🎰 Stock: <code>${stock}</code>\n\n`
    })
    await Context.editMessageText(message, { parse_mode: 'HTML' })

    let markup = {
        inline_keyboard: [
            [Markup.button.url("💫 Buy", "tg://user?id=304506948"),
            Markup.button.callback("↩️ Go back", "main")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})

client.action("account", (Context) => {
    return Context.answerCbQuery(`Oh, ${Context.match[0]}! Great choice`)
})
client.action("info", (Context) => {
    return Context.answerCbQuery(`Oh, ${Context.match[0]}! Great choice`)
})

client.action("panel", async (Context) => {
    await Context.editMessageText(`<b>🛠️ Administator Panel (Beta)</b>`, { parse_mode: 'HTML' })

    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Add Product", "addproduct"),
            Markup.button.callback("Remove Product", "rmproduct"),
            Markup.button.callback("Edit Product", "editproduct")],
            [Markup.button.callback("Add Admin", "addadmin"),
            Markup.button.callback("Remove Admin", "rmadmin")],
            [Markup.button.callback("Broadcast Message", "broadcast")],
            [Markup.button.callback("Edit MOTD", "motd")],
            [Markup.button.callback("↩️ Go Back", "main")]
        ]
    }

    await Context.editMessageReplyMarkup(markup)
})
// #endregion

//#region Panel Actions
//#region Action: add product
client.action("addproduct", async (Context) => {
    await Context.scene.enter("addproduct")
})
//#endregion
//#region Action: remove product
client.action("rmproduct", async (Context) => {
    await Context.editMessageText(`<b>Select the product you want to remove:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Products.forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `rmproduct-${Products.indexOf(item)}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Go Back", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^rmproduct-\d{1,}/, async (Context) => {
    let index = Context.match[0].split("-")[1]
    await Context.editMessageText(`<b>Are you sure you want to delete product <code>${Products[index].name}</code>?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `rm-${Products.indexOf(Products[index])}`), Markup.button.callback("❌", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^rm-\d{1,}/, async (Context) => {
    let index = Context.match[0].split("-")[1]
    delete Products[index]
    updateLocal()

    await Context.editMessageText(`<b>Product deleted successfully!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Go Back", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion
//#region Action: edit product
client.action("editproduct", async (Context) => {
    await Context.editMessageText(`<b>Select the product you want to edit:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Products.forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `editproduct-${Products.indexOf(item)}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Go Back", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^editproduct-\d{1,}/, async (Context) => {
    let index = Context.match[0].split("-")[1]
    let product = Products[index]
    await Context.editMessageText(`<b>What you want to edit about product <code>${product.name}</code>?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Name", `changename-${Products.indexOf(product)}`), Markup.button.callback("Price", `changeprice-${Products.indexOf(product)}`), Markup.button.callback("Stock", `changestock-${Products.indexOf(product)}`)],
            [Markup.button.callback("Visibility", `changevis-${Products.indexOf(product)}`)],
            [Markup.button.callback("↩️ Go Back", "editproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^changename-\d{1,}/, async (Context) => {
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("editname", {product: index})
})
client.action(/^changeprice-\d{1,}/, async (Context) => {
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("changeprice", {product: index})
})
client.action(/^changestock-\d{1,}/, async (Context) => {
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("changestock", {product: index})
})
client.action(/^changevis-\d{1,}/, async (Context) => {
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("changevis", {product: index})
})
//#endregion
//#endregion

// #region Launching

client.launch({
    dropPendingUpdates: true
})
process.once("SIGINT", () => client.stop("SIGINT"))
process.once("SIGTERM", () => client.stop("SIGTERM"))
// #endregion