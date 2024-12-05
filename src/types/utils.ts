import {
  ChatInputApplicationCommandData,
  Collection,
  CommandInteraction,
  ClientEvents,
  Guild,
  Client,
  ClientUser
} from 'discord.js';

export interface GuildCommandInteraction extends CommandInteraction {
  guild: Guild
}

export interface CommandClient extends Client {
  user: ClientUser
}


export interface Command {
  name: string;
  description: string;
  category: string;
  dmPermission: boolean;
  options?: ChatInputApplicationCommandData['options'];
  cooldown?: number;
  execute(interaction: GuildCommandInteraction, args: Record<string, any>, client: CommandClient): Promise<void>;
}

export interface Event<T extends keyof ClientEvents = keyof ClientEvents> {
  name: T;
  once?: boolean;
  execute(...args: ClientEvents[T]): Promise<void> | void;
}

declare module 'discord.js' {
  export interface Client {
    cmds: Collection<string, Command>;
  }
}