import chalk from 'chalk';
import moment from 'moment';

const log = (content, type = "log") => {
    const timestamp = `[${moment().format("DD-MM-YY H:m:s")}]`;
    switch (type) {
        case "log": {
            return console.log(`${timestamp} ${chalk.blue(type.toUpperCase())} ${content} `);
        }
        case 'warn': {
            return console.log(`${timestamp} ${chalk.yellow(type.toUpperCase())} ${content} `);
        }
        case 'error': {
            return console.log(`${timestamp} ${chalk.red(type.toUpperCase())} ${content} `);
        }
        case 'cmd': {
            return console.log(`${timestamp} ${chalk.gray(type.toUpperCase())} ${content}`);
        }
        case 'ready': {
            return console.log(`${timestamp} ${chalk.green(type.toUpperCase())} ${content}`);
        }
        case 'success': {
            return console.log(`${timestamp} ${chalk.greenBright(type.toUpperCase())} ${content}`);
        }
        case 'load': {
            return console.log(`${timestamp} ${chalk.magenta(type.toUpperCase())} ${content} `);
        }
        case 'event': {
            return console.log(`${timestamp} ${chalk.cyan(type.toUpperCase())} ${content} `);
        }
        default: throw new TypeError('Wrong type of logger kid');
    }
};

export default {
    error: (...args) => log(...args, 'error'),
    warn: (...args) => log(...args, 'warn'),
    cmd: (...args) => log(...args, 'cmd'),
    ready: (...args) => log(...args, 'ready'),
    load: (...args) => log(...args, 'load'),
    event: (...args) => log(...args, 'event'),
    success: (...args) => log(...args, 'success'),
  };
  