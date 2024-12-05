import { GameMode } from "@/types/constants";

export const gameModes: GameMode[] = [
    {
        name: 'Crimson',
        id: 'crimson',
        minPlayer: 1,
        choiceOptions: [
            {
                numberOfPlayers: 5,
                guaranteed: { roles: ['godfather', 'detective', 'doctor'] },
                random: [
                    { players: 1, roles: ['executioner'], maybe: true },
                    { players: 'remaining', roles: ['vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] }
                ]
            },
            {
                numberOfPlayers: 8,
                guaranteed: { roles: ['godfather', 'detective', 'doctor'] },
                random: [
                    { players: 1, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 1, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'], maybe: true },
                    { players: 'remaining', roles: ['vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] }
                ]
            },
            {
                numberOfPlayers: 11,
                guaranteed: { roles: ['godfather', 'detective', 'doctor'] },
                random: [
                    { players: 1, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 1, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'], maybe: true },
                    { players: 1, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'] },
                    { players: 'remaining', roles: ['vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] }
                ]
            },
            {
                numberOfPlayers: 12,
                guaranteed: { roles: ['godfather', 'detective', 'doctor'] },
                random: [
                    { players: 2, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 2, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'] },
                    { players: 'remaining', roles: ['vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] }
                ]
            },
            {
                numberOfPlayers: 14,
                guaranteed: { roles: ['godfather', 'detective', 'doctor'] },
                random: [
                    { players: 2, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 1, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'], maybe: true },
                    { players: 2, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'] },
                    { players: 1, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'], maybe: true },
                    { players: 'remaining', roles: ['vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] }
                ]
            },
            {
                numberOfPlayers: 16,
                guaranteed: { roles: ['godfather', 'detective', 'doctor'] },
                random: [
                    { players: 3, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 3, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'] },
                    { players: 'remaining', roles: ['vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] }
                ]
            },
            {
                numberOfPlayers: 17,
                guaranteed: { roles: ['godfather', 'detective', 'doctor', 'vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] },
                random: [
                    { players: 3, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 3, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'] },
                ]
            },
            {
                numberOfPlayers: 18,
                guaranteed: { roles: ['godfather', 'detective', 'doctor', 'vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist', 'bomber'] },
                random: [
                    { players: 3, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 3, roles: ['executioner', 'baiter', 'plague', 'hoarder'] },
                ]
            },
            {
                numberOfPlayers: 19,
                guaranteed: { roles: ['godfather', 'detective', 'doctor', 'vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist'] },
                random: [
                    { players: 4, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 4, roles: ['executioner', 'baiter', 'bomber', 'plague', 'hoarder'] },
                ]
            },
            {
                numberOfPlayers: 20,
                guaranteed: { roles: ['godfather', 'detective', 'doctor', 'vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist', 'bomber'] },
                random: [
                    { players: 4, roles: ['mafia', 'framer', 'hacker', 'goose', 'mimic'] },
                    { players: 4, roles: ['executioner', 'baiter', 'plague', 'hoarder'] },

                ]
            },
            {
                numberOfPlayers: 21,
                guaranteed: { roles: ['godfather', 'detective', 'doctor', 'vigilante', 'mayor', 'spy', 'pi', 'distractor', 'watcher', 'link', 'alchemist', 'bomber', 'mafia', 'framer', 'hacker', 'goose', 'mimic', 'executioner', 'baiter', 'plague', 'hoarder'] },
            }
        ],
        roles: [
            {
                roleId: 'godfather',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'detective',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'doctor',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'vigilante',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'mayor',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'spy',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'pi',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'distractor',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'watcher',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'link',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'alchemist',
                maxNumberOfPlayers: 1,
            },
            {
                roleId: 'mafia',
                guaranteed: false,
            },
            {
                roleId: 'framer',
                guaranteed: false,
            },
            {
                roleId: 'hacker',
                guaranteed: false,
            },
            {
                roleId: 'goose',
                guaranteed: false,
            },
            {
                roleId: 'mimic',
                guaranteed: false,
            },
            {
                roleId: 'executioner',
                guaranteed: false,
            },
            {
                roleId: 'baiter',
                guaranteed: false,
            },
            {
                roleId: 'bomber',
                guaranteed: false,
            },
            {
                roleId: 'plague',
                guaranteed: false,
            },
            {
                roleId: 'hoarder',
                guaranteed: false,
            },
            {
                roleId: 'jester',
                guaranteed: false,
            }
        ],
        data: {
        }
    }
]
