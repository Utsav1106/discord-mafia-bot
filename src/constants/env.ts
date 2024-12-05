import logger from '@/utils/logger'
import 'dotenv/config'

const required = (key: string, value?: string): string => {
    if (!value) {
        const errMessage = `Environment variable "${key}" is missing or invalid.`
        logger.error(errMessage)
        throw new Error(errMessage)
    }
    return value
}

export const BOT_TOKEN = required('BOT_TOKEN', process.env.BOT_TOKEN)
export const MONGO_URI = required('MONGO_URI', process.env.MONGO_URI)
export const NODE_ENV = required('NODE_ENV', process.env.NODE_ENV)