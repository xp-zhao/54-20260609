import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends Logger {
  /**
   * 自定义日志方法，添加更多上下文信息
   * @param message 日志消息
   * @param context 日志上下文
   * @param metadata 附加元数据
   */
  log(message: string, context?: string, metadata?: any): void {
    super.log(this.formatMessage(message, metadata), context);
  }

  /**
   * 自定义错误日志方法
   * @param message 错误消息
   * @param trace 错误堆栈
   * @param context 日志上下文
   * @param metadata 附加元数据
   */
  error(message: string, trace?: string, context?: string, metadata?: any): void {
    super.error(this.formatMessage(message, metadata), trace, context);
  }

  /**
   * 自定义警告日志方法
   * @param message 警告消息
   * @param context 日志上下文
   * @param metadata 附加元数据
   */
  warn(message: string, context?: string, metadata?: any): void {
    super.warn(this.formatMessage(message, metadata), context);
  }

  /**
   * 自定义调试日志方法
   * @param message 调试消息
   * @param context 日志上下文
   * @param metadata 附加元数据
   */
  debug(message: string, context?: string, metadata?: any): void {
    super.debug(this.formatMessage(message, metadata), context);
  }

  /**
   * 自定义详细日志方法
   * @param message 详细消息
   * @param context 日志上下文
   * @param metadata 附加元数据
   */
  verbose(message: string, context?: string, metadata?: any): void {
    super.verbose(this.formatMessage(message, metadata), context);
  }

  /**
   * 格式化日志消息，添加元数据
   * @param message 原始消息
   * @param metadata 元数据
   * @returns 格式化后的消息
   */
  private formatMessage(message: string, metadata?: any): string {
    if (!metadata) {
      return message;
    }
    try {
      return `${message} | ${JSON.stringify(metadata)}`;
    } catch {
      return message;
    }
  }
}
