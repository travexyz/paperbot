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

//#region WizardScene
const addProductWizard = new Scenes.WizardScene(
    'addproduct-wizard', // first argument is Scene_ID, same as for BaseScene
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
    },(ctx) => {
        productInfo.stock = ctx.message.text
        ctx.reply("Vuoi nascondere il prodotto dalla lista? (1 si, 0 no)")
        return ctx.wizard.next()
    },(ctx) => {
        productInfo.hidden = (ctx.message.text == "1") ? true : false
        Products.push(productInfo)
        updateLocal()
        ctx.reply(`Aggiunto prodotto ${productInfo.name} (x${productInfo.stock}) al prezzo di ${productInfo.price}!`)
        return ctx.scene.leave()
    },
)

client.use(session());
client.use(new Scenes.Stage([addProductWizard]));
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

//#region panel: add product
client.action("addproduct", async (Context) => {
    await Context.scene.enter("addproduct-wizard")
})
//#endregion
//#region panel: remove product
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
//#region panel: edit product
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
    await Context.editMessageText(`<b>What you want to edit about product <code>${Products[index].name}</code>?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Name", `action`), Markup.button.callback("Price", "action"), Markup.button.callback("Stock", "action")],
            [Markup.button.callback("Visibility", `action`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
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