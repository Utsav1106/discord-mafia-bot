import guildModel from "@/models/guild";

export const getGuild = async (guildId: string) => {
    let guild = await guildModel.findOne({ guildId: guildId });
    if (!guild) guild = await guildModel.create({ guildId: guildId });

    return guild;
}