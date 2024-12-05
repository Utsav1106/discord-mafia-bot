import { roles } from '@/constants/roles';
import Discord, { CommandInteraction } from 'discord.js'
const { EmbedBuilder, AttachmentBuilder } = Discord;

export default {
    name: "role_info",
    dmPermission: false,
    description: "Shows information about any specific role",
    category: "info",
    cooldown: 3000,
    options: [
        {
            name: "role",
            description: "Choose role you want info about",
            required: true,
            type: 3,
            choices: roles.map(x => {
                return {
                    name: x.name,
                    value: x.id
                }
            })
        }
    ],
    async execute(i: CommandInteraction, args: { role: string }) {
        await i.deferReply()
        const role = roles.find(z => z.id === args.role);
        if (!role) throw new Error('Role not found');
        const attachment = new AttachmentBuilder(`assets/img/roles/${role.id}.png`);

        const embed = new EmbedBuilder()
            .setTitle(`You are the ${role.name}`)
            .setDescription(role.description)
            .setImage(`attachment://${role.id}.png`)
            .addFields({ name: 'What you do each night 🖐️', value: role.whatToDo.map(x => `▫️ ${x}`).join('\n**OR**\n') })
            .addFields({ name: 'Visit type 🏃‍♂️', value: role.visitType, inline: true })
            .addFields({ name: 'Side 👀', value: role.side.join(' or '), inline: true })
            .addFields({ name: 'Goal 🥅', value: role.goal })
            .addFields({
                name: 'Special Instruction ⭐',
                value: role.instructions.map(x => `▫️ ${x}`).join('\n')
            })
            .setColor('Aqua')
        await i.followUp({ embeds: [embed], files: [attachment] });
    }
}