export class AppError implements Error {
    public name: string = 'AppError'
    constructor(public message: string) {
        if (typeof console !== 'undefined')
            console.log(`${this.name}: ${message}`);
    }

    log(message: string) {
        if (typeof console !== 'undefined')
            console.log(`${this.name}: ${message}`);
    }
}

