import { blue, yellow, red, green } from "colors";
export class Logger {
  maxContextLength: number;
  logger: any;
  constructor() {
    this.logger = console;
  }

  log(message: string, context?: string) {
    if (!message) {
      throw new Error();
    }
    this.logger.log(
      blue("[INFO] ") +
        this.formattedDate() +
        this.formatContext(context) +
        message
    );
  }

  error(message: string, context?: string) {
    this.logger.log(
      red("[ERROR] ") +
        this.formattedDate() +
        this.formatContext(context) +
        message
    );
  }

  warning(message: string, context?: string) {
    this.logger.log(
      yellow("[WARNING] ") +
        this.formattedDate() +
        this.formatContext(context) +
        message
    );
  }

  private formatContext(context?: string): string {
    if (!context) return " ";
    if (!this.maxContextLength) this.maxContextLength = context.length;
    this.maxContextLength = Math.max(this.maxContextLength, context.length);

    return green(" [" + context.padEnd(this.maxContextLength, " ") + "] ");
  }

  private formattedDate() {
    return green(new Date().toISOString());
  }
}
