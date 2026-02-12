import { logger, sanitizeForUser } from '@/lib/logger';

export class AppError implements Error {
    public name: string = 'AppError';

    /** User-friendly message (sanitized; safe to show in UI). */
    public readonly userMessage: string;

    constructor(
        public message: string,
        public readonly cause?: unknown
    ) {
        this.userMessage = sanitizeForUser(cause ?? message);
        logger.error(`${this.name}:`, message, cause != null ? cause : '');
    }

    log(message: string) {
        logger.log(`${this.name}:`, message);
    }
}

