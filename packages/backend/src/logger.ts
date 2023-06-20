import cluster from 'node:cluster';
import util from 'util';
import chalk from 'chalk';
import { default as convertColor } from 'color-convert';
import { format as dateFormat } from 'date-fns';
import { Logging } from '@google-cloud/logging';
import stripAnsi from 'strip-ansi';
import { bindThis } from '@/decorators.js';
import { envOption } from './env.js';
import type { KEYWORD } from 'color-convert/conversions';

type Context = {
	name: string;
	color?: KEYWORD;
};

type Level = 'error' | 'success' | 'warning' | 'debug' | 'info';
type CloudLogging = any | undefined;

export default class Logger {
	private context: Context;
	private parentLogger: Logger | null = null;
	private store: boolean;
	private clConfig?: CloudLogging;

	constructor(context: string, color?: KEYWORD, store = true, clConfig?: CloudLogging) {
		this.context = {
			name: context,
			color: color,
		};
		this.store = store;
		this.clConfig = clConfig;
	}

	@bindThis
	public createSubLogger(context: string, color?: KEYWORD, store = true): Logger {
		const logger = new Logger(context, color, store);
		logger.parentLogger = this;
		return logger;
	}

	@bindThis
	private log(level: Level, message: string, data?: Record<string, any> | null, important = false, subContexts: Context[] = [], store = true): void {
		if (envOption.quiet) return;
		if (!this.store) store = false;
		if (level === 'debug') store = false;

		if (this.parentLogger) {
			this.parentLogger.log(level, message, data, important, [this.context].concat(subContexts), store);
			return;
		}

		const timestamp = new Date();
		const time = dateFormat(timestamp, 'HH:mm:ss');
		const worker = cluster.isPrimary ? '*' : cluster.worker!.id;
		const l =
			level === 'error' ? important ? chalk.bgRed.white('ERR ') : chalk.red('ERR ') :
			level === 'warning' ? chalk.yellow('WARN') :
			level === 'success' ? important ? chalk.bgGreen.white('DONE') : chalk.green('DONE') :
			level === 'debug' ? chalk.gray('VERB') :
			level === 'info' ? chalk.blue('INFO') :
			null;
		const contexts = [this.context].concat(subContexts).map(d => d.color ? chalk.rgb(...convertColor.keyword.rgb(d.color))(d.name) : chalk.white(d.name));
		const m =
			level === 'error' ? chalk.red(message) :
			level === 'warning' ? chalk.yellow(message) :
			level === 'success' ? chalk.green(message) :
			level === 'debug' ? chalk.gray(message) :
			level === 'info' ? message :
			null;

		let log = `${l} ${worker}\t[${contexts.join(' ')}]\t${m}`;
		if (envOption.withLogTime) log = chalk.gray(time) + ' ' + log;

		console.log(important ? chalk.bold(log) : log);
		if (level === 'error' && data) {
			console.log(data);
			this.writeCloudLogging(level, log, timestamp, data);
		} else {
			this.writeCloudLogging(level, log, timestamp, null);
		}
	}

	private async writeCloudLogging(level: Level, message: string, time: Date, data?: Record<string, any> | null) {
		if (!this.clConfig) return;
		if (!this.clConfig.projectId || !this.clConfig.saKeyPath) return;

		let lv = level;
		if (level === 'success') lv = 'info';

		const projectId = this.clConfig.projectId;
		const logging = new Logging({ projectId: projectId, keyFilename: this.clConfig.saKeyPath });
		const logName = this.clConfig.logName ?? 'cherrypick';
		const log = logging.log(logName);
		const logMessage = stripAnsi(message);

		const metadata = {
			severity: lv.toUpperCase(),
			resource: {
				type: 'global',
				timestamp: time,
			},
			labels: {
				name: `${this.context.name}`,
				color: `${this.context.color}`,
			},
		};

		const dataString = data ? '\n' + util.inspect(data, { depth: null }) : '';
		const entry = log.entry(metadata, logMessage + dataString);

		await log.write(entry);
	}

	@bindThis
	public error(x: string | Error, data?: Record<string, any> | null, important = false): void { // 実行を継続できない状況で使う
		if (x instanceof Error) {
			data = data ?? {};
			data.e = x;
			this.log('error', x.toString(), data, important);
		} else if (typeof x === 'object') {
			this.log('error', `${(x as any).message ?? (x as any).name ?? x}`, data, important);
		} else {
			this.log('error', `${x}`, data, important);
		}
	}

	@bindThis
	public warn(message: string, data?: Record<string, any> | null, important = false): void { // 実行を継続できるが改善すべき状況で使う
		this.log('warning', message, data, important);
	}

	@bindThis
	public succ(message: string, data?: Record<string, any> | null, important = false): void { // 何かに成功した状況で使う
		this.log('success', message, data, important);
	}

	@bindThis
	public debug(message: string, data?: Record<string, any> | null, important = false): void { // デバッグ用に使う(開発者に必要だが利用者に不要な情報)
		if (process.env.NODE_ENV !== 'production' || envOption.verbose) {
			this.log('debug', message, data, important);
		}
	}

	@bindThis
	public info(message: string, data?: Record<string, any> | null, important = false): void { // それ以外
		this.log('info', message, data, important);
	}
}
