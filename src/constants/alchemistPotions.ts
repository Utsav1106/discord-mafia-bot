import { AlchemistPotion } from "@/types/constants";

export const alchemistPotions: AlchemistPotion[] = [
    {
        name: 'Lethal Potion',
        id: 'lethal',
        description: 'Kills a person',
        info: 'Kills the player. That\'s it. Pretty simple.\nOh ya if you\'re on the mafia\'s side you can still kill the mafias so be careful with that thing.'
    },
    {
        name: 'Invisibility Potion',
        id: 'invisibility',
        description: 'Makes your target invisible and unvisitable from others.',
        info: 'Makes your target invisible and unvisitable from others.'
    },
    {
        name: 'Truth Potion',
        id: 'truth',
        description: 'Force a player to reveal their side to you.',
        info: 'Force a player to reveal their side to you.'
    },
    {
        name: 'Mundane Potion',
        id: 'mundane',
        description: 'It does nothing. Except it tastes a little bitter.',
        info: 'It does nothing. Except it tastes a little bitter.'
    }
]
