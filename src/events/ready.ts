import logger from "@/utils/logger"
import { Client } from "discord.js"

export default (client: Client) => {
    logger.success(`Logged in as ${client.user?.tag}`)
}