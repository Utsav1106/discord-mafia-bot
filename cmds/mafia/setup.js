import Discord from 'discord.js';
const { EmbedBuilder, Client, AttachmentBuilder, Interaction, ChannelType, PermissionFlagsBits } = Discord;
import { roles, gameModes } from '../../tools/jsons.js';
import GuildSchema from '../../database/guildSchema.js';

export default {
    name: "setup",
    description: "Send each player their roles and creates the mafia channel. Do this before starting.",
    category: "mafia",
    dmPermission: false,
    cooldown: 25000,
    /**
    * @param {Interaction} i 
    * @param {Client} client 
    */
    async execute(i, args, client) {
        await i.deferReply()
        let guild = await GuildSchema.findOne({ guildId: i.guild.id })
        if (!guild) guild = await GuildSchema.create({ guildId: i.guild.id })
        if (!guild.party.length) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`There's no party lmao😅`)
                .setColor('Red')
            return i.followUp({ embeds: [embed] })
        } else {
            if (guild.party[0].userId !== i.user.id) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`❌ You are not the host!`)
                    .setColor('Red')
                return i.followUp({ embeds: [embed] })
            }
            if (guild.currentGame.status) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`Mafia game has already been setup, type /start to start it.`)
                    .setColor('Red')
                return i.followUp({ embeds: [embed] })
            }
            const gameMode = gameModes.find(x => guild.gameMode === x.id)

            if (guild.party.length < gameMode.minPlayer) {
                const embed = new EmbedBuilder()
                    .setTitle(`Sorry. You need at least ${gameMode.minPlayer} people to play the game. You only have ${guild.party.length} players. Type /join to join the party.`)
                    .setColor('Red')
                return i.followUp({ embeds: [embed] })
            }
            guild.currentGame.status = true
            guild.markModified('currentGame')
            await guild.save()

            i.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Please wait. Setting game with mode: \`${gameMode.id}\``)
                        .setColor('Orange')
                ]
            })
            let party = guild.party;
            let partyWithRoles = shuffleArray(party.map(obj => ({ ...obj })));
            let roleOption = gameMode.choiceOptions.sort((a, b) => b.numberOfPlayers - a.numberOfPlayers).find(x => x.numberOfPlayers <= partyWithRoles.length)
            let rolesInGame = []
            if (roleOption.guaranteed) {
                for (const role of roleOption.guaranteed.roles) {
                    rolesInGame.push(role)
                }
            }
            if (roleOption.random?.length) {
                for (const random of roleOption.random) {
                    let chances = 100
                    if (random.maybe) chances = 50
                    const chance = Math.random() * 100
                    console.log(random, chance)
                    if (chances > chance) {
                        let playersRequired = random.players
                        if (playersRequired === 'remaining') playersRequired = random.roles.length
                        console.log(playersRequired)
                        const randomRoles = shuffleArray(random.roles)
                        for (var m100 = 0; m100 < playersRequired; m100++) {
                            rolesInGame.push(randomRoles[m100])
                        }
                    }
                }
            }
            console.log(rolesInGame)
            partyWithRoles.forEach((x, i) => {
                let role = roles.find(z => z.id === rolesInGame[i])
                console.log(rolesInGame[i])
                x.role = role.id
                x.side = role.side[Math.floor(Math.random() * role.side.length)]
                x.dead = false
            })
            guild.party = await Promise.all(party.map(async x => {
                const y = partyWithRoles.find(z => z.userId === x.userId)
                return { userId: y.userId, displayName: y.displayName, username: y.username, role: y.role, dead: y.dead, side: y.side }
            }))
            let userCheckError = []

            for (const x of guild.party) {
                const user = await client.users.fetch(x.userId)
                    .catch(async () => {
                        userCheckError.push(x.userId)
                    })
                if (!user) {
                    userCheckError.push(x.userId)
                } else {
                    try {
                        x.username = user.username
                        x.displayName = user.tag
                        guild.markModified('party')
                        await guild.save()
                        let role = roles.find(z => z.id === x.role)
                        const attachment = new AttachmentBuilder(`assets/img/roles/${role.id}.png`);

                        const embed = new EmbedBuilder()
                            .setTitle(`You are the ${role.name}`)
                            .setDescription(role.description)
                            .setImage(`attachment://${role.id}.png`)
                            .addFields({ name: 'What you do each night 🖐️', value: role.whatToDo.map(x => `▫️ ${x}`).join('\n**OR**\n') })
                            .addFields({ name: 'Visit type 🏃‍♂️', value: role.visitType, inline: true })
                            .addFields({ name: 'Side 👀', value: x.side, inline: true })
                            .addFields({ name: 'Goal 🥅', value: role.goal })
                            .addFields({
                                name: 'Special Instruction ⭐',
                                value: role.instructions.map(x => `▫️ ${x}`).join('\n')
                            })
                            .setColor('Aqua')
                        await user.send({ embeds: [embed], files: [attachment] }).catch((err) => {
                            userCheckError.push(x.userId)
                        })
                    } catch (err) {
                        console.log(err)
                        userCheckError.push(x.userId)
                    }
                }
            }
            if (userCheckError.length) {
                guild.party = guild.party.filter(x => !userCheckError.includes(x.userId))
                guild.currentGame = {}
                await GuildSchema.findOneAndUpdate({ guildId: guild.guildId }, { $set: { currentGame: guild.currentGame, party: guild.party } })
                return i.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Error')
                            .setDescription(`DM of ${userCheckError.map(x => `<@${x}>`).join(', ')} is closed, They have been kicked from the party.`)
                            .setColor('Red')
                    ]
                })
            }
            let permissionOverwrites = [
                {
                    id: i.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                }
            ]
            guild.party.forEach(x => {
                permissionOverwrites.push({
                    id: x.userId,
                    deny: [PermissionFlagsBits.SendMessages],
                    allow: [PermissionFlagsBits.ViewChannel]
                })
            })
            let checkChannelPermsError = false
            let channel = await i.guild.channels.create({
                name: "mafia",
                type: ChannelType.GuildText,
                parent: guild.categoryId || null,
                permissionOverwrites: permissionOverwrites
            }).catch(err => {
                checkChannelPermsError = true
            })
            if (checkChannelPermsError) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`I dont have permission to create channel in the mafia category.`)
                    .setColor('Red')
                return i.channel.send({ embeds: [embed] })
            }

            guild.markModified('party')
            guild.currentGame.channelId = channel.id
            guild.currentGame.gameMode = gameMode.id
            guild.markModified('currentGame')
            await guild.save()
            const img4 = new AttachmentBuilder(`assets/img/mafia/4.png`);
            const embed = new EmbedBuilder()
                .setTitle('Everything\'s ready! Everyone feel free to join a voice chat and /start to start the game!')
                .setColor('Green')
                .setThumbnail('attachment://4.png')
                .setDescription(`Make sure you understand how the game works! (Info can be found with /game)`)
            return i.channel.send({ embeds: [embed], files: [img4] })
        }
    }
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
