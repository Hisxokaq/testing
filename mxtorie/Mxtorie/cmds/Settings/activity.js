const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed = require("../../functions/embed/main")
const language = require("../../lang.json")
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };
module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name).then(async () => {
            await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, this.help.name], async (error, result) => {
                var canaccess = false
                try {
                    if (error) return message.reply(language[lang].error + error)
                    if (!result[0]) canaccess = true
                    if (result[0].perm == '0') canaccess = true
                    if (result[0].perm == '1') if (perm[0]) canaccess = true
                    if (result[0].perm == '2') if (perm[0] || perm[1]) canaccess = true
                    if (result[0].perm == '3') if (perm[0] || perm[1] || perm[2]) canaccess = true
                    if (result[0].perm == 'giveaway') if (perm[3]) canaccess = true
                    if (result[0].perm == 'mention everyone') if (perm[4]) canaccess = true
                    if (result[0].perm == 'whitelist') if (whitelisted) canaccess = true
                    if (result[0].perm == 'owner') if (config.owners.includes(message.author.id) || config.buyer == message.author.id || config.creator == message.author.id) canaccess = true
                    if (result[0].perm == 'buyer') if (config.buyer == message.author.id || config.creator == message.author.id) canaccess = true
                    if (!canaccess) return message.channel.send(language[lang].permissionmissing + `**\`perm ${result[0].perm} minimum\`**`)
                    var lang2 = lang
                    var botaccess = true
                    var botperm = this.help.access_bot.map(i => ` \`${permissions.fr[i]}\` |`)
                    if (this.help.access_bot.length > 0) {
                        await this.help.access_bot.map(i => {
                            if (!message.guild.me.hasPermission(i)) return botaccess = false
                        })
                        lang = language[`${lang}`]
                        if (!botaccess) return embed.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]
                    let author = await db.fetch(`activity_${message.guild.id}`)

                    let timeout = 60000;

                    if (author !== null && timeout - (Date.now() - author) > 0) {
                        let time = ms(timeout - (Date.now() - author));

                        let timeEmbed = new Discord.MessageEmbed()
                            .setColor("#FFFFFF")
                            .setDescription(`❌ Tu as déjà changé l'activité du bot.\n\nRé-essayer dans : ${pretty(ms(time))} `);
                        message.channel.send(timeEmbed)
                    } else {
                        if (!args[0]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        let type2 = args[0].toUpperCase()
                        if (type2 != "PLAYING" && type2 != "STREAMING" && type2 != 'LISTENING' && type2 != 'WATCHING' && type2 != 'COMPETING') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        let msg = args.splice(1).join(' ')
                        if (!msg) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        if (type2 != "STREAMING") client.user.setActivity(msg, { type: type2 }).catch(e => { return message.reply(e) })
                        else client.user.setActivity(msg, { type: type2, url: "https://www.twitch.tv/Jeotique" }).catch(e => { return message.reply(e) })
                        message.channel.send(`${lang.by == 'by' ? `\`${getNow().time}\` :white_check_mark: Activity changed for : **${msg}** | Type : **${type2}**` : `\`${getNow().time}\` :white_check_mark: Activité changé pour : **${msg}** | Type : **${type2}**`}`)
                        config.activity = msg
                        config.activitytype = type2
                        db.set(`activity_${message.guild.id}`, Date.now())
                        return fs.writeFile(`./config.json`, JSON.stringify(config), (x) => {
                            if (x) console.error(x)
                        });
                    }
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "activity",
    aliases: [`status`],
    desc: ["Change l'activité du bot", "Change the activity of the bot"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["activity <streaming/listening/playing/watching/competing> <votre message>"],
    type: ["Paramètres", "Settings"],
    perm: "buyer"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'buyer']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}