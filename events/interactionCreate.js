import Discord from 'discord.js';
const {  EmbedBuilder } = Discord;

const cooldowns = {};

export default async (client, i) => {
  if (i.isCommand()) {
    const cmd = client.cmds.get(i.commandName);
    if (!cmd) {
      await i.deferReply({ ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("An error occurred while executing the command.")
        .setColor("Red");
      return i.editReply({ embeds: [embed] });
    }
    const args = {};

    for (let option of i.options.data) {
      if (option.type === "SUB_COMMAND") {
        if (option.name) {
          args[option.name] = option.options.map((x) => {
            if (x.value) return { [x.name]: x.value };
          });
        }
      } else if (option.value) {
        args[option.name] = option.value;
      }
    }
    let cooldown = cooldowns[`${i.user.id}_${cmd.name}`];
    if (cooldown && cooldown > Date.now()) {
      const embed = new EmbedBuilder()
        .setTitle("Calm Down..")
        .setDescription(
          `You just used that command. Try again in ${Math.round(
            (cooldown - Date.now()) / 1000
          )} Seconds`
        )
        .setColor("Red");
      return i.reply({ embeds: [embed], ephemeral: true });
    }
    cooldowns[`${i.user.id}_${cmd.name}`] = Date.now() + cmd.cooldown;
    try {
      client.log.cmd(`${i.user.tag} used /${cmd.name}`);
      cmd.execute(i, args, client);
    } catch (error) {
      console.log(error);
      return i.reply({content: 'An error occured, please try again'})
    }
  }
}
