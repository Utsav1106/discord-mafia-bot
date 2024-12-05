import { alchemistPotions } from "@/constants/alchemistPotions";
import { gameModes } from "@/constants/gameModes";
import { mafiaMessages } from "@/constants/messages";
import { roles, rolesOrder } from "@/constants/roles";
import guildModel from "@/models/guild";
import { PartyMember } from "@/types/constants";
import { Command } from "@/types/utils";
import { getGuild } from "@/utils/guild";
import { sleep, inWords } from "@/utils/helpers";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    Client,
    EmbedBuilder,
    PermissionFlagsBits,
    TextChannel,
    User,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonInteraction,
    ButtonStyle,
    MessageComponentInteraction,
    AnySelectMenuInteraction,
} from "discord.js";
import { readdirSync } from "fs";

interface ExtendedPartyMember {
    username: string;
    displayName: string;
    userId: string;
    side: string;
    potion?: string;
    hoarded?: number;
    kills?: number;
    target?: string;
    dead?: boolean;
    infected?: boolean;
    plagueVote?: boolean;
    lynched?: boolean;
    role: string;
    user?: User;
    fakeRole?: string;
    fakeSide?: string;
    distracted?: boolean;
    distractedLastTime?: boolean;
    revealed?: boolean;
    lastTarget?: string;
    bombs?: string[];
}

interface GameResponse {
    id: string;
    values: string[];
    locked: boolean;
    user?: User;
}

interface VoteData {
    userId: string;
    votes: string[];
}


export default {
    name: "start",
    description: "Start the mafia game with everyone in the party.",
    category: "mafia",
    dmPermission: false,
    cooldown: 25000,
    async execute(i, _, client) {
        try {
            await i.deferReply();
            const guild = await getGuild(i.guild!.id);
            if (!guild.currentGame.status || !guild.currentGame.channelId) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user!.displayAvatarURL(), name: client.user!.username })
                    .setDescription(`You didn't set up yet. Type /setup first.`)
                    .setColor("Red");
                return i.followUp({ embeds: [embed] });
            }
            if (guild.currentGame.started) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user!.displayAvatarURL(), name: client.user!.username })
                    .setDescription(`Mafia game has already been started in <#${guild.currentGame.channelId}>`)
                    .setColor("Red");
                return i.followUp({ embeds: [embed] });
            }
            if (guild.party[0].userId !== i.user.id) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user!.displayAvatarURL(), name: client.user!.username })
                    .setDescription(`❌ You are not the host!`)
                    .setColor("Red");
                return i.followUp({ embeds: [embed] });
            }

            let channel: TextChannel;
            try {
                channel = (await i.guild!.channels.fetch(guild.currentGame.channelId)) as TextChannel;
            } catch {
                guild.currentGame = {};
                await guildModel.findOneAndUpdate(
                    { guildId: guild.guildId },
                    { $set: { currentGame: guild.currentGame } }
                );
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user!.displayAvatarURL(), name: client.user!.username })
                    .setDescription(`Mafia channel has been deleted, you will need to setup again.`)
                    .setColor("Red");
                return i.followUp({ embeds: [embed] });
            }
            guild.currentGame.started = true;
            guild.currentGame.startChannelId = i.channel!.id;
            guild.currentGame.roundNumber = 1;
            await guildModel.findOneAndUpdate(
                { guildId: guild.guildId },
                { $set: { currentGame: guild.currentGame, wills: {} } }
            );
            const img1 = new AttachmentBuilder(`assets/img/mafia/1.png`);
            await i.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user!.username, iconURL: client.user!.displayAvatarURL() })
                        .setDescription(`Everyone please navigate to <#${channel.id}>!`)
                        .setColor("Red")
                        .setImage("attachment://1.png"),
                ],
                files: [img1],
            });
            await sleep(2000);

            await channel.send({ content: `${guild.party.map((x) => `<@${x.userId}>`).join(" ")}` });
            const img2 = new AttachmentBuilder(`assets/img/mafia/2.png`);
            await channel.send({
                files: [img2],
                embeds: [
                    new EmbedBuilder()
                        .setImage("attachment://2.png")
                        .setColor("DarkVividPink")
                        .setDescription(
                            ":closed_book:If you haven't read the rules yet, please type /game to view them in your dm!"
                        )
                        .setTitle(":hand_splayed:Welcome to Mafia!")
                        .addFields(
                            {
                                name: ":exclamation: HEY LISTEN UP",
                                value:
                                    ":anger:Please do not type in this chat unless instructed to do so. Admins please don't abuse your godly powers and talk when other people can't. Thank you.",
                                inline: false,
                            },
                            {
                                name: ":skull: To those who are dead:",
                                value:
                                    "Please do not talk. I know it's hard to grasp but dead people can't talk. Also no reactions because, you know, dead people also can't react.",
                                inline: false,
                            },
                            {
                                name: ":eyes:Some important rules:",
                                value:
                                    ":no_entry_sign:Screen shots are not permitted and would only ruin the game. However you CAN claim roles to either coordinate among yourselves or trick other people. Just NO SCREENSHOTS.",
                                inline: false,
                            },
                            {
                                name: ":speaking_head:Some useful commands:",
                                value: "/reset, /help, /game",
                                inline: true,
                            }
                        )
                        .setFooter({
                            text: "Note: Parts of the game can be customized with /config commands! To view current settings use /settings.",
                        }),
                ],
            });
            await sleep(2000);
            if (!guild.showDeadRole) {
                const img3 = new AttachmentBuilder(`assets/img/mafia/3.png`);
                await sleep(2000);
                await channel.send({
                    files: [img3],
                    embeds: [
                        new EmbedBuilder()
                            .setImage("attachment://3.png")
                            .setColor("Orange")
                            .setDescription(
                                "Type /write >message< to start writing your will!\nType /will to view your will!\nType /erase >line #< to delete a line in your will! \nWhen you potentially die, your will is going to be revealed to everyone!"
                            )
                            .setTitle(
                                "Take advantage of the will system! Leave crucial information before you die!✍️\nMafias: DON'T SAY WHO THE OTHER MAFIAS ARE IN YOUR WILL"
                            ),
                    ],
                });
            }
            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user!.username, iconURL: client.user!.displayAvatarURL() })
                        .setDescription("Alright! Let the game begin!")
                        .setColor("Red"),
                ],
            });
            const userCheckError: string[] = [];
            for (const x of guild.party) {
                const user = await client.users
                    .fetch(x.userId)
                    .catch(() => {
                        userCheckError.push(x.userId);
                        return undefined;
                    });
                if (!user) {
                    userCheckError.push(x.userId);
                } else {
                    try {
                        if (x.side === "Mafia") {
                            const embed = new EmbedBuilder()
                                .setTitle("Here are the mafia in this game")
                                .setColor("Yellow")
                                .setFooter({ text: "Cooporate with your fellow mafias through dm to make strategies!" });
                            guild.party
                                .filter((z) => z.side === "Mafia" && z.role !== "alchemist")
                                .forEach((z) => {
                                    const roleOfUser = roles.find((y) => y.id === z.role);
                                    if (!roleOfUser) throw new Error(`Role not found for user ${z.username}`);
                                    embed.addFields({ name: `${z.displayName} (${z.username})`, value: `Role: ${roleOfUser.name}` });
                                });
                            await user.send({ embeds: [embed] }).catch(() => {
                                userCheckError.push(x.userId);
                            });
                        }
                        if (x.role === "executioner") {
                            const filteredParty = guild.party.filter((y) => y.role !== "jester" && y.userId !== x.userId);
                            const target = filteredParty[Math.floor(Math.random() * filteredParty.length)];
                            x.target = target.userId;
                            await guildModel.findOneAndUpdate(
                                { guildId: guild.guildId },
                                { $set: { party: guild.party } }
                            );
                            const embed = new EmbedBuilder()
                                .setTitle(
                                    `Alright executioner. Your target is ${target.displayName} (${target.username}). Convince the town to lynch knight and you win. Ezpz`
                                )
                                .setDescription(`If your target is killed by any other ways, you will become a jester`)
                                .setColor("Random");
                            await user.send({ embeds: [embed] }).catch(() => {
                                userCheckError.push(x.userId);
                            });
                        } else if (x.role === "jester") {
                            const embed = new EmbedBuilder()
                                .setTitle(`Alright Jester. Your aim is to convince the town to lynch you`)
                                .setDescription(`Once you are lynched the game ends and you win!`)
                                .setColor("Random");
                            await user.send({ embeds: [embed] }).catch(() => {
                                userCheckError.push(x.userId);
                            });
                        }
                    } catch {
                        userCheckError.push(x.userId);
                    }
                }
            }
            if (userCheckError.length) {
                guild.party = guild.party.filter((x) => !userCheckError.includes(x.userId));
                guild.currentGame = {};
                await guildModel.findOneAndUpdate(
                    { guildId: guild.guildId },
                    { $set: { currentGame: guild.currentGame, party: guild.party } }
                );
                await channel.delete().catch(() => { });
                return i.channel!.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Error")
                            .setDescription(
                                `DM of ${userCheckError.map((x) => `<@${x}>`).join(", ")} is closed, They have been kicked from the party.\nYou will have to setup and start again now.`
                            )
                            .setColor("Red"),
                    ],
                });
            }

            return startRounds(channel, client, guild.guildId);
        } catch (e) {
            console.log(e);
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user!.displayAvatarURL(), name: client.user!.username })
                .setDescription((e as Error).message || `ERROR: An unknown error occurred while executing the command.`)
                .setColor("Red");
            await i.channel!.send({ embeds: [embed] });
        }
    },
} as Command;

const checkEnd = async (channel: TextChannel, client: Client, guildId: string): Promise<{ win: boolean }> => {
    const guild = await getGuild(guildId);
    const alivePlayers = guild.party.filter((x) => !x.dead);
    const mafias = alivePlayers.filter((x) => x.side === "Mafia");
    const villagers = alivePlayers.filter((x) => x.side === "Village");
    const neutrals = alivePlayers.filter((x) => x.side === "Neutral");
    let winner: string | null = null;

    const plague = alivePlayers.find((z) => z.role === "plague");
    if (plague) {
        const infected = alivePlayers.find((z) => !z.infected && z.role !== "plague");
        if (!infected) {
            if (!plague.plagueVote) {
                plague.plagueVote = true;
                await guildModel.findOneAndUpdate({ guildId: guild.guildId }, { $set: { party: guild.party } });
                await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("🦠 Plague Doctor Alert 🦠")
                            .setDescription(
                                "Attention, citizens! The sinister Plague Doctor has infected everyone in town! ☣️\nThe town has one night to identify and lynch the Plague Doctor, or else the doctor will claim victory! ⌛"
                            )
                            .setColor("#00FF00")
                            .setImage("attachment://plague-alert.png"),
                    ],
                    files: [
                        new AttachmentBuilder(
                            `assets/img/other-mafia/plague-alert/${readdirSync("assets/img/other-mafia/plague-alert")[
                            Math.floor(Math.random() * readdirSync("assets/img/other-mafia/plague-alert").length)
                            ]
                            }`,
                            { name: "plague-alert.png" }
                        ),
                    ],
                });
            } else winner = "plague";
        }
    }
    const executioner = alivePlayers.find((z) => z.role === "executioner");
    if (executioner) {
        const target = guild.party.find((z) => z.userId === executioner.target);
        if (target?.dead) {
            if (target.lynched) {
                winner = "executioner";
                await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Who Saw That Coming?! ")
                            .setDescription(
                                `Holy cow, folks! The Executioner, <@${executioner.userId}>, just pulled off an epic win by convincing the town to lynch their target, <@${target.userId}>! Talk about a plot twist! 🎉🎉`
                            )
                            .setColor("#FF4500")
                            .setImage(`attachment://executioner-win`),
                    ],
                    files: [
                        new AttachmentBuilder(
                            `assets/img/other-mafia/executioner-win/${readdirSync("assets/img/other-mafia/executioner-win")[
                            Math.floor(Math.random() * readdirSync("assets/img/other-mafia/executioner-win").length)
                            ]
                            }`,
                            { name: "executioner-win.png" }
                        ),
                    ],
                });
            } else {
                executioner.role = "jester";
                await guildModel.findOneAndUpdate({ guildId: guild.guildId }, { $set: { party: guild.party } });
            }
        }
    }
    const jester = guild.party.find((z) => z.role === "jester");
    if (jester?.dead) {
        if (jester.lynched) {
            winner = "jester";
            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🔔 Town Fooled! Jester Rules!")
                        .setDescription(
                            `Whoa! Talk about playing mind games! The sneaky ${jester.displayName} just tricked the entire town into thinking they were guilty and got themselves lynched! Unbelievable, but that's a win for the Jester! 🎉`
                        )
                        .setColor("#FF69B4")
                        .setThumbnail(`attachment://jester-win.png`),
                ],
                files: [
                    new AttachmentBuilder(
                        `assets/img/other-mafia/jester-win/${readdirSync("assets/img/other-mafia/jester-win")[
                        Math.floor(Math.random() * readdirSync("assets/img/other-mafia/jester-win").length)
                        ]
                        }`,
                        { name: "jester-win.png" }
                    ),
                ],
            });
        }
    }
    if (!winner) {
        if (!villagers.length) {
            if (neutrals.length) {
                const bomberCheck = alivePlayers.find((z) => z.role === "bomber");
                if (bomberCheck) {
                    winner = "bomber";
                    await channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`💣 Bomber Victory 💣`)
                                .setDescription(`Boom! 💥 The city trembles as ${bomberCheck.displayName} bombs everyone and emerges victorious! 💣💥`)
                                .setColor("Blue")
                                .setImage("attachment://bomber.png"),
                        ],
                        files: [
                            new AttachmentBuilder(
                                `assets/img/other-mafia/bomber-victory/${readdirSync("assets/img/other-mafia/bomber-victory")[
                                Math.floor(Math.random() * readdirSync("assets/img/other-mafia/bomber-victory").length)
                                ]
                                }`,
                                { name: "bomber.png" }
                            ),
                        ],
                    });
                }
            } else if (mafias.length && !villagers.length) {
                winner = "mafia";
            }
        } else if (mafias.length >= villagers.length) {
            winner = "mafia";
        } else if (!mafias.length) {
            winner = "village";
        }
    }
    if (winner) {
        const winnerImgFolder =
            winner === "village"
                ? "village-win"
                : winner === "mafia"
                    ? "mafia-win"
                    : winner === "executioner"
                        ? "executioner-win"
                        : winner === "jester"
                            ? "jester-win"
                            : winner === "bomber"
                                ? "bomber-victory"
                                : "plague-alert";
        const winMsg = {
            embeds: [
                new EmbedBuilder()
                    .setTitle(
                        winner === "jester"
                            ? "🤡 Jester Outsmarts Them All! The Court of Foolery Celebrates!"
                            : winner === "executioner"
                                ? "⚔️ Executioner's Plot Succeeds! The Guillotine Claims Its Prize!"
                                : winner === "plague"
                                    ? "🦠 The Plague Doctor Infected everyone! Coughs and Sneezes Echo! 🤧"
                                    : winner === "bomber"
                                        ? "💣 Bomber Unleashes Chaos! Explosions Rock the Town! 💥"
                                        : winner === "mafia"
                                            ? "🗡️ The Mafias Win!"
                                            : winner === "village"
                                                ? "🎊 The Villagers Wins!"
                                                : "Unknown Winner"
                    )
                    .setColor("Blue")
                    .setDescription(
                        guild.party
                            .map(
                                (x) =>
                                    `${x.dead ? "🪦" : "<:angel:1120795474891374662>"} <@${x.userId}> - ${roles.find((y) => y.id === x.role)?.name
                                    } ${x.side === "Mafia" ? "<:mafia:1120795487394615326>" : x.side === "Village" ? "🕊️" : "<:neutral:1120795439940251850>"}`
                            )
                            .join("\n")
                    )
                    .setImage("attachment://winner.png"),
            ],
            files: [
                new AttachmentBuilder(
                    `assets/img/other-mafia/${winnerImgFolder}/${readdirSync(`assets/img/other-mafia/${winnerImgFolder}`)[
                    Math.floor(Math.random() * readdirSync(`assets/img/other-mafia/${winnerImgFolder}`).length)
                    ]
                    }`,
                    { name: "winner.png" }
                ),
            ],
        };
        await channel.send(winMsg);
        const channel2 = await client.channels.fetch(guild.currentGame.startChannelId!).catch(() => { });
        if (channel2?.isTextBased()) {
            await channel2.send(winMsg);
            if (neutrals.length) {
                await Promise.all(
                    neutrals.map(async (x) => {
                        if (x.role === "baiter") {
                            if (x.kills && x.kills >= 3 && !x.dead) {
                                await channel2.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`The baiter is ${x.displayName}`)
                                            .setDescription(`The baiter has a kill count of 3, so ${x.displayName} also wins.`)
                                            .setColor("Orange"),
                                    ],
                                });
                            }
                        } else if (x.role === "hoarder" && !x.dead) {
                            if (x.hoarded && x.hoarded >= 3) {
                                await channel2.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`The hoarder is ${x.displayName}`)
                                            .setDescription(`The hoarder collected 3 stashes of toilet paper! The hoarder also wins!`)
                                            .setColor(`Green`),
                                    ],
                                });
                            }
                        }
                    })
                );
            }
        }
        await guildModel.findOneAndUpdate({ guildId: guild.guildId }, { $set: { currentGame: {} } });
        return { win: true };
    }
    return { win: false };
};

const startRounds = async (channel: TextChannel, client: Client, guildId: string): Promise<void> => {
    try {
        const guild = await getGuild(guildId);
        const check = await checkEnd(channel, client, guildId);
        if (check.win) return;

        const permissionOverwrites: {
            id: string;
            allow?: bigint[];
            deny?: bigint[];
        }[] = [
                {
                    id: guild.guildId,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
            ];
        guild.party.forEach((x) => {
            permissionOverwrites.push({
                id: x.userId,
                deny: [PermissionFlagsBits.SendMessages],
                allow: [PermissionFlagsBits.ViewChannel],
            });
        });

        await channel.permissionOverwrites.set(permissionOverwrites).catch(() => { });

        const img5 = new AttachmentBuilder(`assets/img/mafia/5.png`);
        const embed1 = new EmbedBuilder()
            .setTitle(`Night ${guild.currentGame.roundNumber}`)
            .addFields(
                {
                    name: "Current Alive:",
                    value: guild.party.filter((x) => !x.dead).map((x) => `🙂 │ <@${x.userId}>`).join("\n\n"),
                    inline: true,
                },
                {
                    name: "Current Dead:",
                    value: !guild.party.filter((x) => x.dead).length
                        ? "No one died yet..."
                        : guild.party.filter((x) => x.dead).map((x) => `💀 │ <@${x.userId}>`).join("\n\n"),
                    inline: true,
                }
            )
            .setImage("attachment://5.png")
            .setColor("Blue");
        await channel.send({ embeds: [embed1], files: [img5] });
        await sleep(2000);

        const img6 = new AttachmentBuilder(`assets/img/mafia/6.png`);
        const embed2 = new EmbedBuilder()
            .setTitle(`It is now night time, time to go to sleep...`)
            .setDescription(`Don't panic, I muted all of you`)
            .setImage("attachment://6.png")
            .setColor("Blue");
        await channel.send({ embeds: [embed2], files: [img6] });
        await sleep(2000);

        const img7 = new AttachmentBuilder(`assets/img/mafia/7.png`);
        const embed3 = new EmbedBuilder()
            .setTitle(`Everyone with a useful role please click the button below!`)
            .setDescription(`Jk all roles are useful...`)
            .setImage("attachment://7.png")
            .setFooter({ text: "Aka everyone with an available action tonight that wants to do something click that green boi." })
            .setColor("Blue");
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel("Action").setStyle(ButtonStyle.Success).setCustomId("mafia_action")
        );
        const msg = await channel.send({ embeds: [embed3], files: [img7], components: [row] });
        for (const x of guild.party) {
            if (x.role === "alchemist") {
                const randomPotion = alchemistPotions[Math.floor(Math.random() * alchemistPotions.length)];
                x.potion = randomPotion.id;
                guild.markModified("party");
                await guild.save();
                const user = await client.users.fetch(x.userId);
                if (user) {
                    await user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Tonight, you crafted a ${randomPotion.name}`)
                                .setDescription(`${randomPotion.info}`)
                                .setColor("Red"),
                        ],
                    });
                }
            }
        }
        const collectorFilter = (m: MessageComponentInteraction) => m.customId === "mafia_action";
        const collector = channel.createMessageComponentCollector({ filter: collectorFilter, time: guild.currentGame.dmTime! });
        const responses: Record<string, { values: string[]; locked: boolean }> = {};
        let end = false;
        collector.on("collect", async (m: ButtonInteraction) => {
            try {
                const userData = guild.party.find((x) => x.userId === m.user.id);
                if (!userData || userData.dead) {
                    await m.reply({ ephemeral: true, content: "Ey yo hold up. You don't have an action available tonight get out of here." });
                } else if (responses[userData.userId]?.locked) {
                    await m.reply({ ephemeral: true, content: "Your action has already been locked" });
                } else {
                    const role = roles.find((z) => z.id === userData.role);
                    if (!role) throw new Error(`Role not found for user ${userData.userId}`);
                    if (!role.data.action?.noAction) {
                        const embed = new EmbedBuilder()
                            .setTitle(
                                (role.data.action.embedTitle || "").replace(
                                    "${potion}",
                                    `${alchemistPotions.find((z) => z.id === userData.potion)?.name || userData.potion}`
                                )
                            )
                            .setDescription(role.data.action.embedDescription || "Select with the dropdown menu below to choose your target!")
                            .setColor(role.side.includes("Mafia") ? "Red" : "Blue");
                        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setLabel("Lock in")
                                .setCustomId("mafia_response_lock_in")
                                .setEmoji("🔒")
                                .setStyle(ButtonStyle.Success)
                        );
                        if (!role.data.action.getTargets) throw new Error(`getTargets function not defined for role ${role.id}`);
                        const targetOptions = await role.data.action.getTargets(guild.party, userData, guild);

                        const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([targetOptions]);
                        const msg2 = await m.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
                        const filter = (m2: any) =>
                            ["mafia_action_select_target", "mafia_response_lock_in"].includes(m2.customId) && m.user.id === m2.user.id;
                        const collector2 = msg2.createMessageComponentCollector({ filter, time: guild.currentGame.dmTime! });
                        collector2.on("collect", async (m2) => {
                            try {
                                if (!end) {
                                    if (m2.isStringSelectMenu() && m2.customId === "mafia_action_select_target") {
                                        responses[m2.user.id] = { values: m2.values, locked: false };
                                        await m2.deferUpdate();
                                    } else if (m2.isButton() && m2.customId === "mafia_response_lock_in") {
                                        if (!responses[m2.user.id]) {
                                            await m2.reply({ content: "You need to choose your target before locking response", ephemeral: true }).catch(() => { });
                                        } else {
                                            responses[m2.user.id].locked = true;
                                            const newRow1 = ActionRowBuilder.from<ButtonBuilder>(row1);
                                            newRow1.components[0].setDisabled(true);
                                            const newRow2 = ActionRowBuilder.from<StringSelectMenuBuilder>(row2);
                                            newRow2.components[0].setDisabled(true);
                                            await m2.update({ components: [newRow1, newRow2] }).catch(() => { });
                                            await collector2.stop();
                                        }
                                    }
                                } else {
                                    await m2.reply({ content: "You can no longer perform any action", ephemeral: true });
                                }
                            } catch { }
                        });
                    } else {
                        await m.reply({ ephemeral: true, content: "Ey yo hold up. You don't have an action available tonight get out of here." });
                    }
                }
            } catch { }
        });
        collector.on("end", async () => {
            const lockedResponses: Record<string, { values: string[]; locked: boolean }> = {};
            Object.keys(responses)
                .filter((z) => responses[z].locked)
                .forEach((z) => {
                    lockedResponses[z] = responses[z];
                });
            end = true;
            const newRow = ActionRowBuilder.from<ButtonBuilder>(row);
            newRow.components[0].setDisabled(true);
            await msg.edit({ components: [newRow] }).catch(() => { });
            await getAfterMath(
                channel,
                client,
                guild.guildId,
                Object.keys(responses)
                    .filter((z) => responses[z].locked)
                    .map((z) => {
                        return { id: z, ...responses[z] };
                    })
            );
            guild.currentGame.roundNumber = (guild.currentGame.roundNumber || 1) + 1;
            await guildModel.findOneAndUpdate(
                { guildId: guild.guildId },
                { $set: { currentGame: guild.currentGame } }
            );
            const check = await checkEnd(channel, client, guildId);
            if (check.win) return;
            await votingPhase(channel, client, guildId);
        });
    } catch (err) {
        console.log(err);
    }
};

const getAfterMath = async (
    channel: TextChannel,
    client: Client,
    guildId: string,
    responses: GameResponse[]
): Promise<PartyMember[]> => {
    try {
        const guild = await getGuild(guildId);
        let party = guild.party;
        const gameMode = gameModes.find((z) => z.id === guild.currentGame.gameMode);
        const sortedParty = party
            .map((obj) => ({ ...obj }))
            .sort((a, b) => rolesOrder.findIndex((z) => z === a.role) - rolesOrder.findIndex((z) => z === b.role));
        const alsoHappened: string[] = [];
        let mafiaKilledUser: ExtendedPartyMember | undefined;
        let savedByDoctor: ExtendedPartyMember | undefined;
        let mayorRevealed: ExtendedPartyMember | undefined;
        for (const x of sortedParty) {
            const user = await client.users
                .fetch(x.userId)
                .catch(() => {
                    alsoHappened.push(`- ❌ I killed ${x.displayName} for leaving server during the game`);
                    x.dead = true;
                    return undefined;
                });
            const role = roles.find((z) => z.id === x.role);
            if (!role) throw new Error(`Role not found for user ${x.userId}`);
            const response = responses.find((z) => z.id === x.userId && z.locked);

            if (!user) {
                x.dead = true;
                alsoHappened.push(`- ❌ I killed ${x.displayName} for leaving server during the game`);
            } else {
                x.user = user;
                if (!role.data.action.noAction && response) {
                    if (response?.locked) {
                        const embed = new EmbedBuilder()
                            .setTitle(
                                `You have selected ${response.values.find((rr) => !guild.party.find((x) => rr === x.userId))
                                    ? response.values.join(" and ")
                                    : response.values.map((rr) => guild.party.find((x) => rr === x.userId)!.displayName).join(" and ")
                                }`
                            )
                            .setDescription(`You may now return to the mafia channel in the server. <#${channel.id}>`)
                            .setColor("Green");
                        await user
                            .send({ embeds: [embed] })
                            .catch(() => {
                                x.dead = true;
                                alsoHappened.push(`❌ I killed ${x.displayName} for leaving server/closing DM during the game`);
                            });
                    } else {
                        const embed = new EmbedBuilder().setTitle("You chose nothing. Lmao.").setColor("Red");
                        await user
                            .send({ embeds: [embed] })
                            .catch(() => {
                                x.dead = true;
                                alsoHappened.push(`❌ I killed ${x.displayName} for leaving server/closing DM during the game`);
                            });
                    }
                }
            }
        }

        for (const x of sortedParty) {
            if (!x.dead && !x.distracted) {
                let response = responses.find((z) => z.id === x.userId);
                let user = x.user;
                if (response) {
                    const values = response.values;
                    if (x.role === "goose") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (!target) throw new Error(`Target not found for Goose action for user ${x.userId}`);
                            if (!target.dead) {
                                let targetsTarget = responses.find((z) => z.id === targetId);
                                if (!targetsTarget) {
                                    await user!.send({ content: `${target.displayName} didn't visit anyone last night. Weird...` }).catch(() => { });
                                } else {
                                    let alivePlayers = sortedParty.filter((z) => !z.dead);
                                    let newTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                                    responses.find((z) => z.id === targetId)!.values[0] = newTarget.userId;
                                    await target.user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle("Target Switched")
                                                .setDescription(`The Goose has randomly switched your target to ${newTarget.displayName}`)
                                                .setColor("Red"),
                                        ],
                                    }).catch(() => { });
                                    await user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(`You have successfully Goosed ${target.displayName}`)
                                                .setDescription(`${target.displayName}'s target is now ${newTarget.displayName}`)
                                                .setColor("Red"),
                                        ],
                                    }).catch(() => { });
                                }
                            } else {
                                await user!.send({
                                    embeds: [new EmbedBuilder().setTitle(`Your target died before you could goose him lol`).setColor("Red")],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "mimic") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target && !target.dead) {
                                const win = Math.random() * 100;
                                x.fakeRole = target.role;
                                x.fakeSide = target.side;
                                let embedDescription = "";
                                let targetRole = roles.find((z) => z.id === target.role);
                                if (targetRole?.data.action.noAction === false && responses.find((z) => z.id === target.userId)) {
                                    if (win < 50) {
                                        embedDescription = `${target.displayName}, however, still has the energy to perform their task.`;
                                    } else {
                                        target.distracted = true;
                                        embedDescription = `${target.displayName} was too tired to perform their task tonight.`;
                                        await target.user!.send({
                                            embeds: [new EmbedBuilder().setTitle("You were too tired to perform your task tonight.").setColor("Red")],
                                        }).catch(() => { });
                                    }
                                } else embedDescription = `${target.displayName}, however, still has the energy to perform their task.`;
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`You have drained and assumed ${target.displayName}'s identity. What's this person's identity? Who knows lol.`)
                                            .setDescription(embedDescription)
                                            .setColor("Purple"),
                                    ],
                                }).catch(() => { });
                            } else {
                                await user!.send({
                                    embeds: [new EmbedBuilder().setTitle(`Your target died before you could use your potion lol`).setColor("Red")],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "alchemist") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (!target) throw new Error(`Target not found for alchemist action for user ${x.userId}`);
                            if (!target.dead) {
                                if (x.potion === "lethal") {
                                    target.dead = true;
                                    if (target.user)
                                        await target.user.send({
                                            embeds: [new EmbedBuilder().setTitle(`You were poised by the alchemist and died...`).setColor("Red")],
                                        }).catch(() => { });
                                    alsoHappened.push(`- <@${target.userId}> was poised by the alchemist...`);
                                    await user!.send({
                                        embeds: [new EmbedBuilder().setTitle(`You poised ${target.displayName}, they died...`).setColor("Red")],
                                    });
                                } else if (x.potion === "invisibility") {
                                    await Promise.all(
                                        responses
                                            .filter((x) => x.values.includes(targetId))
                                            .map(async (x) => {
                                                if (x.user)
                                                    await x.user.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setTitle(`You visited ${target.displayName} but ${target.displayName} was nowhere to be found.`)
                                                                .setDescription(`Looks like the alchemist was behind you.`)
                                                                .setColor("Red"),
                                                        ],
                                                    }).catch(() => { });
                                            })
                                    );
                                    responses = responses.filter((x) => !x.values.includes(targetId));
                                } else if (x.potion === "truth") {
                                    if (target.user)
                                        await target.user.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setTitle(`You were forced to tell the alchemist your side after drinking the Truth Potion!!!`)
                                                    .setDescription(`Let's hope the alchemist is on your side...`)
                                                    .setColor(`Red`),
                                            ],
                                        }).catch(() => { });
                                    await user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle("Truth Potion Unleashed!")
                                                .setDescription(
                                                    `You brewed a potent Truth Potion and made the target reveal their true side!\n${target.displayName}'s side is ${target.side}`
                                                )
                                                .setColor("Blue"),
                                        ],
                                    }).catch(() => { });
                                } else {
                                    await user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(`You realize the potion is useless and ${target.displayName} was not affected. lol.`)
                                                .setColor(`Grey`),
                                        ],
                                    });
                                }
                            } else {
                                await user!.send({
                                    embeds: [new EmbedBuilder().setTitle(`Your target died before you could use your potion lol`).setColor("Red")],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "distractor") {
                        const targetId = values[0];
                        if (targetId) {
                            if (x.distractedLastTime) {
                                x.distractedLastTime = false;
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`You need some rest tonight...`)
                                            .setDescription(`Maybe you can distract someone again tomorrow...`)
                                            .setColor("Grey"),
                                    ],
                                });
                            } else {
                                x.distractedLastTime = true;
                                let target = sortedParty.find((z) => z.userId === targetId);
                                if (target && !target.dead) {
                                    if (target.role === "goose") {
                                        await user!.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setTitle(`You were unable to distract target for some strange reason`)
                                                    .setColor("Red"),
                                            ],
                                        });
                                    } else {
                                        target.distracted = true;

                                        let targetRole = roles.find((z) => z.id === target.role);
                                        if (targetRole && !targetRole.data.action.noAction) {
                                            const distractedDescriptions = [
                                                "Lost in a world of whimsical distractions.",
                                                "Temporarily teleported to a parallel universe of daydreams.",
                                                "Mind took an unexpected detour through the land of imagination.",
                                                "Got caught up in a vortex of comical distractions.",
                                                "Swept away by a whirlwind of amusing diversions.",
                                                "Adventured into a maze of delightful distractions.",
                                                "Took an unplanned comedic intermission from reality.",
                                                "Engulfed in a comical bubble of delightful distractions.",
                                                "Succumbed to the captivating allure of comic relief.",
                                                "Embarked on a whimsical quest through the realm of silliness.",
                                            ];

                                            await target.user!.send({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle("Sorry, you got distracted tonight...")
                                                        .setDescription(`${distractedDescriptions[Math.floor(Math.random() * distractedDescriptions.length)]}`)
                                                        .setColor("Red"),
                                                ],
                                            });
                                        }
                                        await user!.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setTitle(`${target.displayName} was not able to perform their task tonight.`)
                                                    .setColor("Red"),
                                            ],
                                        });
                                    }
                                } else {
                                    await user!.send({
                                        embeds: [new EmbedBuilder().setTitle(`Your target died before you could distract them lol`).setColor("Red")],
                                    }).catch(() => { });
                                }
                            }
                        }
                    } else if (x.role === "godfather") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target && !target.dead) {
                                target.dead = true;
                                await target.user!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle("You were killed by the mafia 🔪")
                                            .setDescription(`How unlucky...`)
                                            .setColor("Red"),
                                    ],
                                }).catch(() => { });
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder().setTitle(`You have decided to attack ${target.displayName}`).setColor("Red"),
                                    ],
                                }).catch(() => { });
                                mafiaKilledUser = target;
                            } else {
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder().setTitle(`Your target died before you could attack them lol`).setColor("Red"),
                                    ],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "vigilante") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target && !target.dead) {
                                let guilt = false;
                                target.dead = true;
                                if (target.side === "Village") {
                                    guilt = true;
                                    x.dead = true;
                                }
                                await target.user!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle("Vigilante shot you tonight")
                                            .setDescription(`You died...`)
                                            .setColor("Red"),
                                    ],
                                }).catch(() => { });
                                let embed = new EmbedBuilder()
                                    .setTitle(
                                        `You shot down ${target.side === "Village" ? "a Villager " : target.side === "Mafia" ? "a Mafia " : ""}${target.displayName}`
                                    )
                                    .setColor("Red");
                                if (guilt) embed.setDescription("You committed suicide in guilt of killing an innocent villager..");
                                await user!.send({ embeds: [embed] }).catch(() => { });
                                alsoHappened.push(
                                    target.side === "Neutral"
                                        ? `The vigilante shot <@${target.userId}>`
                                        : `${guilt ? "❌" : "✅"} The vigilante shot ${guilt ? "a villager" : "a mafia"}!! The ${guilt ? "villager" : "mafia"} shot was <@${target.userId}>`
                                );
                                if (guilt) alsoHappened.push(`The vigilante <@${x.userId}> committed suicide...`);
                            } else {
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder().setTitle(`Your target died before you could distract them lol`).setColor("Red"),
                                    ],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "framer") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target) {
                                const mafiaRoles = sortedParty.filter(x => x.side === "Mafia");
                                if (mafiaRoles.length) {
                                    const randomMafia = mafiaRoles[Math.floor(Math.random() * mafiaRoles.length)];
                                    target.fakeRole = randomMafia.role;
                                    target.fakeSide = "Mafia";
                                }
                                await user!.send({
                                    embeds: [new EmbedBuilder().setTitle(`You have successfully framed ${target.displayName}`).setColor("Green")],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "detective") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target) {
                                let side = target.fakeSide || target.side;
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(side === "Mafia" ? "Green" : "Red")
                                            .setThumbnail(`attachment://${side === "Mafia" ? "9" : "8"}.png`)
                                            .setDescription(
                                                side !== "Mafia"
                                                    ? `Sorry. That person is not the mafia. Please return to the mafia chat now. <#${channel.id}>`
                                                    : `Yes! Your target belongs to mafia. Please return to the mafia chat now <#${channel.id}>`
                                            ),
                                    ],
                                    files: [new AttachmentBuilder(`assets/img/mafia/${side === "Mafia" ? "9" : "8"}.png`)],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "link") {
                        const targetId1 = values[0];
                        const targetId2 = values[1];
                        if (targetId1 && targetId2) {
                            let target1 = sortedParty.find((z) => z.userId === targetId1);
                            let side1 = target1?.fakeSide || target1?.side;

                            let target2 = sortedParty.find((z) => z.userId === targetId2);
                            let side2 = target2?.fakeSide || target2?.side;

                            if (target1?.user)
                                await target1.user.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`You have been linked by The Link tonight with ${target2?.displayName || 'Unknown'}!`)
                                            .setDescription(`${target2?.displayName || 'Unknown'}'s side is: ${side2}!! How the turn tables...`)
                                            .setColor("Purple"),
                                    ],
                                }).catch(() => { });
                            if (target2?.user)
                                await target2.user.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`You have been linked by The Link tonight with ${target1?.displayName || 'Unknown'}!`)
                                            .setDescription(`${target1?.displayName || 'Unknown'}'s side is: ${side1}!! How the turn tables...`)
                                            .setColor("Purple"),
                                    ],
                                }).catch(() => { });
                            await user!.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Purple")
                                        .setTitle(`${target1?.displayName || 'Unknown'} and ${target2?.displayName || 'Unknown'} have been linked.`),
                                ],
                            }).catch(() => { });
                        }
                    } else if (x.role === "doctor") {
                        const targetId = values[0];
                        if (targetId) {
                            x.lastTarget = targetId;
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (mafiaKilledUser?.userId && mafiaKilledUser.userId === targetId && target) {
                                target.dead = false;
                                savedByDoctor = target;
                                if (target.user)
                                    await target.user.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle("You were saved by the doctor")
                                                .setColor("Green")
                                                .setDescription(`Doctor has given you a lifeline, don't die again lol`),
                                        ],
                                    }).catch(() => { });
                            }
                            await user!.send({
                                embeds: [
                                    new EmbedBuilder().setColor("Green").setDescription(`You have decided to save ${target?.displayName || 'Unknown'}`),
                                ],
                            }).catch(() => { });
                        }
                    } else if (x.role === "mayor") {
                        const res = values[0];
                        if (res) {
                            if (res.toLowerCase() === "yes") {
                                x.revealed = true;
                                mayorRevealed = x;
                            }
                        }
                    } else if (x.role === "pi") {
                        const targetId1 = values[0];
                        const targetId2 = values[1];
                        if (targetId1 && targetId2) {
                            let target1 = sortedParty.find((z) => z.userId === targetId1);
                            let side1 = target1?.fakeSide || target1?.side;

                            let target2 = sortedParty.find((z) => z.userId === targetId2);
                            let side2 = target2?.fakeSide || target2?.side;

                            await user!.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Purple")
                                        .setTitle(`${target1?.displayName || 'Unknown'} and ${target2?.displayName || 'Unknown'} are ${side1 !== side2 ? "not " : ""}on the same side.`),
                                ],
                            }).catch(() => { });
                        }
                    } else if (x.role === "spy") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target) {
                                let targetResponse = responses.find((z) => z.id === target.userId);
                                if (targetResponse?.locked && targetResponse.values[0] && sortedParty.find((z) => z.userId === targetResponse.values[0]) && target.role !== "pi") {
                                    await user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(`${target.displayName} visited ${sortedParty.find((z) => z.userId === targetResponse.values[0])!.displayName} tonight.`)
                                                .setColor("Red"),
                                        ],
                                    }).catch(() => { });
                                } else {
                                    await user!.send({ content: `${target.displayName} did not visit anyone tonight` }).catch(() => { });
                                }
                            }
                        }
                    } else if (x.role === "mafia") {
                        if (mafiaKilledUser) {
                            await user!.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(`The Godfather has sent you to attack ${mafiaKilledUser.displayName}`)
                                        .setColor("Red"),
                                ],
                            }).catch(() => { });
                        }
                    } else if (x.role === "hacker") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target && gameMode) {
                                let targetRole = target.fakeRole || target.role;
                                let threeRoles = [targetRole];
                                for (let i = 0; i < 2; i++) {
                                    let random = gameMode.roles[Math.floor(Math.random() * gameMode.roles.length)].roleId;
                                    if (threeRoles.includes(random)) {
                                        i--;
                                        continue;
                                    }
                                    threeRoles.push(random);
                                }
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`The results are back! ${target.displayName}'s role could be one of these:`)
                                            .setDescription(`${threeRoles.join(", ")}`)
                                            .setColor("Red"),
                                    ],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "hoarder") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target && !target.dead) {
                                if (target.user)
                                    await target.user.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle("The hoarder has come for your stash of toilet paper!")
                                                .setDescription(`You're in the fight for your life!`)
                                                .setColor("Aqua")
                                                .setImage("attachment://10.png"),
                                        ],
                                        files: [new AttachmentBuilder("assets/img/mafia/10.png")],
                                    }).catch(() => { });
                                let win = Math.random() * 100;
                                if (win < 75) {
                                    target.dead = true;
                                    await user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle("You won the duel")
                                                .setDescription(`You gained one stack of toilet paper`)
                                                .setColor("Red"),
                                        ],
                                    }).catch(() => { });
                                    if (target.user)
                                        await target.user.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setTitle("Sadly, you lost the duel...")
                                                    .setDescription("You died...and the hoarder took all your toilet paper...")
                                                    .setImage("attachment://11.png")
                                                    .setColor("Red"),
                                            ],
                                            files: [new AttachmentBuilder("assets/img/mafia/11.png")],
                                        }).catch(() => { });
                                    if (!x.hoarded) x.hoarded = 0;
                                    x.hoarded += 1;
                                } else {
                                    await user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle("You lost the duel")
                                                .setDescription(`Sadly you lost the duel and were not able to steal their toilet paper.`)
                                                .setColor("Red"),
                                        ],
                                    }).catch(() => { });
                                    if (target.user)
                                        await target.user.send({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setTitle("You won the duel...")
                                                    .setDescription("You won! The hoarder ran away..")
                                                    .setColor("Green"),
                                            ],
                                        }).catch(() => { });
                                }
                            } else {
                                await user!.send({
                                    embeds: [new EmbedBuilder().setTitle(`Your target died before you could visit them lol`).setColor("Red")],
                                }).catch(() => { });
                            }
                        }
                    } else if (x.role === "bomber") {
                        const targetId = values[0];
                        if (targetId) {
                            if (!x.bombs) x.bombs = [];
                            if (targetId === "detonate") {
                                if (x.bombs) {
                                    x.bombs.forEach((bomb) => {
                                        let userBombed = sortedParty.find((z) => z.userId === bomb);
                                        if (userBombed) {
                                            alsoHappened.push(`- ❌ <@${bomb}> was blown up by the bomber last night!💣💣💣`);
                                            userBombed.dead = true;
                                        }
                                    });
                                }
                            } else {
                                x.bombs.push(targetId);
                                await user!.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`Currently planted bombs:`)
                                            .setColor("Blue")
                                            .setDescription(
                                                `${x.bombs
                                                    .map((bomb) => {
                                                        const bombUser = sortedParty.find((z) => z.userId === bomb);
                                                        return bombUser?.displayName || "Unknown Member";
                                                    })
                                                    .join("\n")}`
                                            ),
                                    ],
                                });
                            }
                        }
                    } else if (x.role === "watcher") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target) {
                                let whoseTarget = responses.filter((z) => z.values.includes(targetId) && z.locked);
                                if (!whoseTarget.length) {
                                    await user!.send({ content: `No one visited ${target.displayName} last night...` }).catch(() => { });
                                } else {
                                    await user!.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(`Someone tripped the wire!`)
                                                .setDescription(
                                                    `${whoseTarget
                                                        .map((x) => {
                                                            return sortedParty.find((z) => z.userId === x.id)?.displayName || 'Unknown';
                                                        })
                                                        .join(" and ")} visited ${target.displayName}`
                                                )
                                                .setColor("Red"),
                                        ],
                                    }).catch(() => { });
                                }
                            }
                        }
                    } else if (x.role === "plague") {
                        const targetId = values[0];
                        if (targetId) {
                            let target = sortedParty.find((z) => z.userId === targetId);
                            if (target) {
                                target.infected = true;
                                let usersVisitedYou = responses.filter((z) => z.values.includes(user!.id));
                                if (usersVisitedYou.length) {
                                    await Promise.all(
                                        usersVisitedYou.map(async (x) => {
                                            const userVisited = sortedParty.find((z) => z.userId === x.id && !z.infected && !z.dead);
                                            if (userVisited) {
                                                userVisited.infected = true;
                                                await user!.send({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setTitle(`${userVisited.displayName} visited you and gained the plague!`)
                                                            .setColor(`Green`),
                                                    ],
                                                });
                                            }
                                        })
                                    );
                                }
                                const usersVisitedInfected = responses.filter((z) =>
                                    z.values.find((y) => {
                                        const userInfected = sortedParty.find((p) => p.userId === y && p.infected);
                                        return userInfected;
                                    })
                                );
                                if (usersVisitedInfected.length) {
                                    await Promise.all(
                                        usersVisitedInfected.map(async (x) => {
                                            let infectedUser = sortedParty.find((z) => z.infected && x.values.includes(z.userId));
                                            const userVisited = sortedParty.find((z) => z.userId === x.id && !z.infected && !z.dead);
                                            if (userVisited && infectedUser) {
                                                userVisited.infected = true;
                                                await user!.send({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setTitle(`${userVisited.displayName} visited ${infectedUser.displayName} and now ${infectedUser.displayName} also has the plague!`)
                                                            .setColor(`Green`),
                                                    ],
                                                });
                                            }
                                        })
                                    );
                                }
                            }
                        }
                    }
                } else {
                    if (x.role === "baiter") {
                        let dead = responses.filter((z) => z.locked && z.values.includes(x.userId));
                        await Promise.all(
                            dead.map(async (z) => {
                                let visitor = sortedParty.find((y) => y.userId === z.id);
                                if (!visitor) return;
                                let visitorRole = roles.find((x) => x.id === visitor.role);
                                if (!visitorRole) return;
                                if (visitorRole.visitType === "Active") {
                                    alsoHappened.push(`❌ ${visitor.displayName} visited baiter last night and died...`);
                                    if (visitor.user)
                                        await visitor.user.send({
                                            embeds: [new EmbedBuilder().setTitle("Oh no, your target turns out to be baiter!").setColor("Red")],
                                        }).catch(() => { });

                                    if (!x.kills) x.kills = 1;
                                    else x.kills += 1;

                                    visitor.dead = true;
                                    await user!.send({ content: `${visitor.displayName} visited you last night. ${inWords(x.kills)} kill down....` });
                                }
                            })
                        );
                    }
                }
            }
        }
        await channel
            .send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user!.username, iconURL: client.user!.displayAvatarURL() })
                        .setDescription(`Alright everybody get your butts back here. It's storytime.`)
                        .setColor("Red"),
                ],
            })
            .catch(() => { });
        await sleep(2000);

        if (mafiaKilledUser) {
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${mafiaKilledUser.displayName} was attacked by the mafia :(`)
                            .setDescription(
                                mafiaMessages[Math.floor(Math.random() * mafiaMessages.length)].replace(/{username}/g, mafiaKilledUser.displayName)
                            )
                            .setImage("attachment://12.png")
                            .setColor("Red"),
                    ],
                    files: [new AttachmentBuilder("assets/img/mafia/12.png")],
                })
                .catch(() => { });
        } else {
            let checkGodfather = sortedParty.find((z) => z.role === "godfather");
            if (checkGodfather) {
                await channel
                    .send({
                        embeds: [new EmbedBuilder().setColor("Red").setTitle(`Mafia was too lazy to kill anyone...`)],
                    })
                    .catch(() => { });
            } else {
                await channel
                    .send({
                        embeds: [new EmbedBuilder().setTitle(`Godfather doesn't exist. So...`).setColor("Red")],
                    })
                    .catch(() => { });
            }
        }
        if (savedByDoctor) {
            await sleep(2000);
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Life Restored: ${savedByDoctor.displayName} Rescued`)
                            .setDescription(`The skilled Doctor brings <@${savedByDoctor.userId}> back from the edge of despair`)
                            .setImage("attachment://14.png")
                            .setColor("Green"),
                    ],
                    files: [new AttachmentBuilder("assets/img/mafia/14.png")],
                })
                .catch(() => { });
        }
        if (alsoHappened.length) {
            await sleep(2000);
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Oh ya, this also happened...")
                            .setDescription(alsoHappened.map((z) => `- ${z}`).join("\n"))
                            .setColor("Blue"),
                    ],
                })
                .catch(() => { });
        }
        if (mayorRevealed) {
            await sleep(2000);
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("🧐 Mayor has been revealed!!")
                            .setDescription(`<@${mayorRevealed.userId}> is the mayor!`)
                            .setImage("attachment://mayor.png")
                            .setColor("Green"),
                    ],
                    files: [new AttachmentBuilder("assets/img/roles/mayor.png")],
                })
                .catch(() => { });
        }
        let checkGodfather = sortedParty.find((z) => z.role === "godfather" && !z.dead);
        if (!checkGodfather) {
            let newGodfather = sortedParty.find((z) => z.side === "Mafia" && !z.dead);
            if (newGodfather) {
                newGodfather.role = "godfather";
                if (newGodfather.user)
                    await newGodfather.user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({ name: client.user!.username, iconURL: client.user!.displayAvatarURL() })
                                .setDescription("Since the godfather is dead, YOU are now the godfather. GL lol.")
                                .setColor("Red"),
                        ],
                    }).catch(() => { });
            }
        }
        let checkBomber = sortedParty.find((z) => z.role === "bomber" && !z.dead);
        if (checkBomber?.dead && checkBomber.bombs) {
            checkBomber.bombs.forEach((bomb) => {
                let bombedUser = sortedParty.find((z) => z.userId === bomb);
                if (bombedUser) bombedUser.dead = true;
            });
            await sleep(2000);
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Before Bomber died, killed some more people.`)
                            .setDescription(`Ignore embed hehe`)
                            .setColor("Red"),
                    ],
                })
                .catch(() => { });
        }
        await sleep(2000);
        const embed1 = new EmbedBuilder()
            .setTitle(`Currently Dead`)
            .setDescription(
                !sortedParty.find((x) => x.dead)
                    ? "No one died yet..."
                    : sortedParty.filter((x) => x.dead).map((x) => `💀 │ <@${x.userId}>`).join("\n\n")
            )
            .setThumbnail("attachment://13.png")
            .setColor("Blue");
        await channel
            .send({
                embeds: [embed1],
                files: [new AttachmentBuilder("assets/img/mafia/13.png")],
            })
            .catch(() => { });
        for (const x of sortedParty) {
            if (!x.dead) continue;
            const guildMember = guild.party.find((z) => z.userId === x.userId);
            if (guildMember?.dead) {
                if (guild.wills[x.userId]?.length) {
                    let lines = guild.wills[x.userId];
                    const willEmbed = new EmbedBuilder()
                        .setTitle(`${x.displayName}'s will`)
                        .setDescription(lines.join("\n"))
                        .setColor("Green")
                        .setThumbnail(x.user!.displayAvatarURL());
                    await channel.send({ embeds: [willEmbed] });
                }
                if (x.user)
                    await x.user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    "Hey, you died! Feel free to spectate the rest of the game but PLEASE do not talk nor give away important information to those still playing. Thank you!"
                                )
                                .setDescription(`Pssss I cannot play mini games while you wait! Type /mini to check it out!`)
                                .setColor("Red")
                                .setThumbnail("attachment://15.png"),
                        ],
                        files: [new AttachmentBuilder("assets/img/mafia/15.png")],
                    }).catch(() => { });
            }
        }
        sortedParty.forEach((x) => {
            x.fakeRole = undefined;
            x.fakeSide = undefined;
            x.distracted = undefined;
        });
        guild.party = party.map((x) => {
            let value = sortedParty.find((z) => z.userId === x.userId)!;
            return { ...value, user: undefined };
        });
        await guildModel.findOneAndUpdate({ guildId: guild.guildId }, { $set: { party: guild.party } });
        return sortedParty;
    } catch (err) {
        console.log(err);
        return [];
    }
};

const votingPhase = async (channel: TextChannel, client: Client, guildId: string): Promise<void> => {
    try {
        const guild = await getGuild(guildId);
        const alivePlayers = guild.party.filter((z) => !z.dead);
        await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Now I'll give you guys ${Math.round(guild.currentGame.talkTime! / 1000)} seconds to talk.`)
                    .setDescription(
                        `**Want to claim a role? Accuse someone? Confess? Do that now!**\n\nCurrently Alive:\n${guild.party
                            .filter((x) => !x.dead)
                            .map((x) => `- <@${x.userId}>`)
                            .join("\n")}`
                    )
                    .setColor("Orange")
                    .setImage("attachment://16.png"),
            ],
            files: [new AttachmentBuilder("assets/img/mafia/16.png")],
        });
        const permissionOverwrites: {
            id: string;
            allow?: bigint[];
            deny?: bigint[];
        }[] = [
                {
                    id: guild.guildId,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
            ];
        guild.party
            .filter((z) => z.dead)
            .forEach((x) => {
                permissionOverwrites.push({
                    id: x.userId,
                    deny: [PermissionFlagsBits.SendMessages],
                    allow: [PermissionFlagsBits.ViewChannel],
                });
            });
        guild.party
            .filter((z) => !z.dead)
            .forEach((x) => {
                permissionOverwrites.push({
                    id: x.userId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                });
            });

        await channel.permissionOverwrites.set(permissionOverwrites).catch(() => { });

        await sleep(guild.currentGame.talkTime!);
        let minVotes = Math.ceil(alivePlayers.filter((x) => x.side !== "Mafia").length / 2);
        if (minVotes < 2) minVotes = 2;
        const msg = await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Now it is time to nominate! Vote for who should be put on trial!`)
                    .addFields({
                        name: `Minimum votes required: ${minVotes}`,
                        value: alivePlayers.map((x) => `▫️ <@${x.userId}>`).join("\n"),
                    })
                    .setColor("Red")
                    .setFooter({ text: `You have ${Math.round(guild.currentGame.voteTime! / 1000)} seconds to vote` })
                    .setImage("attachment://17.png"),
            ],
            files: [new AttachmentBuilder("assets/img/mafia/17.png")],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId(`mafia_vote_btn`).setLabel("Vote").setStyle(ButtonStyle.Success)
                ),
            ],
        });

        const collectorFilter = (m: MessageComponentInteraction) => m.customId === "mafia_vote_btn";
        const collector = channel.createMessageComponentCollector({
            filter: collectorFilter,
            time: guild.currentGame.voteTime!,
        });
        const votes: Record<string, string> = {};
        let end = false;
        collector.on("collect", async (m: ButtonInteraction) => {
            const userData = guild.party.find((x) => x.userId === m.user.id);
            if (!userData || userData.dead) {
                await m.reply({ ephemeral: true, content: "You cannot vote." });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle(`Nominate for who will be put on the trial today`)
                    .setDescription("Select with the dropdown menu below to choose your target!")
                    .setColor("Green");
                const targetOptions = new StringSelectMenuBuilder()
                    .setCustomId("mafia_action_vote_target_menu")
                    .setPlaceholder("Choose your target")
                    .addOptions([
                        new StringSelectMenuOptionBuilder().setLabel("No One").setValue("noone"),
                        ...alivePlayers.map((x) =>
                            new StringSelectMenuOptionBuilder()
                                .setLabel(x.displayName)
                                .setValue(x.userId)
                                .setDescription(x.username)
                        ),
                    ]);

                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([targetOptions]);
                const msg2 = await m.reply({ embeds: [embed], components: [row], ephemeral: true }).catch(() => undefined);
                if (msg2) {
                    const filter = (m3: any) =>
                        m3.customId === "mafia_action_vote_target_menu" && m.user.id === m3.user.id;
                    const collector2 = msg2.createMessageComponentCollector({
                        filter,
                        time: guild.currentGame.voteTime!,
                    });
                    collector2.on("collect", async (m2: AnySelectMenuInteraction) => {
                        if (!m2) {
                            return collector2.stop();
                        }
                        if (!end && alivePlayers.find((x) => x.userId === m2.user.id)) {
                            if (votes[m2.user.id]) {
                                await m2.reply({ content: "You have already voted", ephemeral: true });
                            } else {
                                if (m2.isStringSelectMenu()) {
                                    votes[m2.user.id] = m2.values[0];
                                }
                                const newRow = ActionRowBuilder.from<StringSelectMenuBuilder>(row);
                                newRow.components[0].setDisabled(true);
                                await m2.update({ components: [newRow] }).catch(() => { });
                                await channel
                                    .send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setAuthor({ name: m2.user.username, iconURL: m2.user.displayAvatarURL() })
                                                .setDescription(`‼️ A vote has been cast by <@${m2.user.id}>.`)
                                                .setColor("Green")
                                                .setFooter({ text: "Note: This could also mean they voted for no one." }),
                                        ],
                                    })
                                    .catch(() => { });
                            }
                        } else {
                            await m2.reply({ content: "You cannot vote", ephemeral: true });
                        }
                    });
                }
            }
        });
        collector.on("end", async () => {
            end = true;

            const newRow = ActionRowBuilder.from<ButtonBuilder>(msg.components[0] as any);
            newRow.components[0].setDisabled(true);
            await msg.edit({ components: [newRow] }).catch(() => { });

            const formattedVotes: VoteData[] = [];
            Object.keys(votes).forEach((x) => {
                const vote = votes[x];
                if (!formattedVotes.find((z) => z.userId === vote)) {
                    formattedVotes.push({
                        userId: vote,
                        votes: [x],
                    });
                } else {
                    const existingVote = formattedVotes.find((z) => z.userId === vote);
                    if (existingVote) {
                        existingVote.votes.push(x);
                    }
                }
            });
            const embed = new EmbedBuilder().setTitle("Nomination Result").setColor("Orange");
            if (!formattedVotes.length) {
                embed.setDescription(`No Votes Casted`);
            } else {
                formattedVotes.forEach((x) => {
                    const partyMember = guild.party.find((z) => z.userId === x.userId);
                    embed.addFields({
                        name: `🗳️ ${partyMember?.displayName || "No One"} (${x.votes.length})`,
                        value: `${x.votes.map(v => {
                            const voter = guild.party.find(z => z.userId === v);
                            return `▫️ <@${v}> ${voter?.role === 'mayor' && voter.revealed ? '(Mayor)' : ''}`;
                        }).join('\n')}`,
                        inline: true
                    });
                });
            }
            await channel.send({
                embeds: [embed]
            });
            let minVoted = formattedVotes.filter(x => x.votes.length >= minVotes).sort((a, b) => b.votes.length - a.votes.length);
            let deadUserData: User | null = null;
            if (!minVoted.length || (minVoted.length > 1 && minVoted[0]?.votes?.length === minVoted[1]?.votes?.length)) {
                await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('There weren\'t enough votes to nominate someone...')
                            .setDescription(`Better work together next time`)
                            .setColor('Red')
                    ]
                });
                await startRounds(channel, client, guild.guildId);
            } else {
                let votedTarget = guild.party.find(z => z.userId === minVoted[0].userId);
                if (!votedTarget) return;

                let lynched = false;
                try {
                    deadUserData = await client.users.fetch(votedTarget.userId);
                } catch {
                    lynched = true;
                }
                if (lynched) {
                    votedTarget.dead = true;
                    await channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Wait a minute..`)
                                .setDescription(`${votedTarget.displayName} has already left the server, what a loser!\nI killed ${votedTarget.displayName} before you could vote them out.`)
                                .setColor('Red')
                        ]
                    });
                    await guildModel.findOneAndUpdate({ guildId: guild.guildId }, { $set: { party: guild.party } });
                    await startRounds(channel, client, guild.guildId);
                } else {
                    if (deadUserData) {
                        await channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(`${votedTarget.displayName} has been called to the stand. How do you plea ${votedTarget.displayName}`)
                                    .setColor('Red')
                                    .setDescription(`You have 30 seconds to defend yourself before the town casts their judgement...`)
                                    .setThumbnail(deadUserData.displayAvatarURL())
                                    .setImage('attachment://18.png')
                            ],
                            files: [new AttachmentBuilder('assets/img/mafia/18.png')]
                        });
                    }
                    await sleep(30000);

                    const msg3 = await channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`It is judgement time 👨‍⚖️👩‍⚖️. The village has 20 seconds to vote.`)
                                .setDescription(`The voting will end once 20s has passed OR everyone has voted.`)
                                .addFields({ name: `👿 Guilty (0)`, value: 'No one...', inline: true }, { name: `Innocent (0)`, value: 'No one...', inline: true })
                                .setColor('Orange')
                                .setImage('attachment://19.png')
                        ],
                        files: [
                            new AttachmentBuilder('assets/img/mafia/19.png')
                        ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel('GUILTY')
                                        .setStyle(ButtonStyle.Danger)
                                        .setCustomId('mafia_vote_guilty')
                                        .setEmoji('👿'),
                                    new ButtonBuilder()
                                        .setLabel('INNOCENT')
                                        .setStyle(ButtonStyle.Primary)
                                        .setCustomId('mafia_vote_innocent')
                                        .setEmoji('👼')
                                )
                        ]
                    });
                    let guilty: string[] = [];
                    let innocent: string[] = [];
                    let end2 = false;
                    const filter = (m: any) => m.customId === 'mafia_vote_innocent' || m.customId === 'mafia_vote_guilty';
                    const collector2 = msg3.createMessageComponentCollector({ filter, time: guild.currentGame.voteTime! });
                    collector2.on('collect', async m2 => {
                        try {
                            if (!end2 && alivePlayers.find(x => x.userId === m2.user.id) && m2.user.id !== votedTarget.userId) {
                                if (guilty.includes(m2.user.id) || innocent.includes(m2.user.id)) {
                                    await m2.reply({ content: 'You have already voted', ephemeral: true });
                                } else {
                                    await m2.deferUpdate();
                                    if (m2.customId === 'mafia_vote_innocent') {
                                        innocent.push(m2.user.id);
                                    } else {
                                        guilty.push(m2.user.id);
                                    }
                                    await m2.editReply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle(`It is judgement time 👨‍⚖️👩‍⚖️. The village has 20 seconds to vote.`)
                                                .setDescription(`The voting will end once 20s has passed OR everyone has voted.`)
                                                .setColor('Orange')
                                                .setImage('attachment://19.png')
                                                .addFields(
                                                    { name: `👿 Guilty (${guilty.length})`, value: !guilty.length ? 'No one...' : `${guilty.map(x => `🟥 <@${x}>`).join('\n')}`, inline: true },
                                                    { name: `Innocent (${innocent.length})`, value: !innocent.length ? 'No one...' : `${innocent.map(x => `🟩 <@${x}>`).join('\n')}`, inline: true }
                                                )
                                        ],
                                        files: [
                                            new AttachmentBuilder('assets/img/mafia/19.png')
                                        ]
                                    });
                                }

                            } else {
                                await m2.reply({ content: 'You can no longer perform any action', ephemeral: true });
                            }
                        } catch { }
                    });

                    collector2.on('end', async () => {
                        end2 = true;
                        if (msg3) {
                            const newRow = ActionRowBuilder.from<ButtonBuilder>(msg3.components[0] as any);
                            newRow.components.forEach(btn => btn.setDisabled(true));
                            await msg3.edit({ components: [newRow] }).catch(() => { });
                            await channel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Blue')
                                        .setTitle(`Here are the final result`)
                                        .addFields(
                                            { name: `👿 Count: ${guilty.length}`, value: !guilty.length ? 'No one...' : `${guilty.map(x => `<@${x}>`).join('\n')}`, inline: true },
                                            { name: `👼 Count: ${innocent.length}`, value: !innocent.length ? 'No one...' : `${innocent.map(x => `<@${x}>`).join('\n')}`, inline: true }
                                        )
                                ]
                            });
                            if (guilty.length > innocent.length) {
                                votedTarget.dead = true;
                                votedTarget.lynched = true;
                                await channel.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`${votedTarget.displayName} has been hanged by the village. Press f to pay respect.`)
                                            .setImage('attachment://20.png')
                                            .setColor('Red')
                                    ], files: [new AttachmentBuilder('assets/img/mafia/20.png')]
                                });
                                if (deadUserData) {
                                    await deadUserData.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setTitle('Hey, you died! Feel free to spectate the rest of the game but PLEASE do not talk nor give away important information to those still playing. Thank you!')
                                                .setDescription(`Pssss I cannot play mini games while you wait! Type /mini to check it out!`)
                                                .setColor('Red')
                                                .setThumbnail('attachment://15.png')
                                        ], files: [new AttachmentBuilder('assets/img/mafia/15.png')]
                                    });
                                }
                            } else if (innocent.length > guilty.length) {
                                await channel.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`Town decided not to lynch ${votedTarget.displayName}`)
                                            .setColor('Green')
                                    ]
                                });
                            } else {
                                await channel.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`There weren\'t enough votes to lynch ${votedTarget.displayName}...`)
                                            .setColor('Green')
                                    ]
                                });
                            }
                        }
                        await guildModel.findOneAndUpdate({ guildId: guild.guildId }, { $set: { party: guild.party } });
                        await sleep(20000);
                        await startRounds(channel, client, guild.guildId);
                    });
                }
            }
        });
    } catch (err) {
        console.log(err);
    }
};