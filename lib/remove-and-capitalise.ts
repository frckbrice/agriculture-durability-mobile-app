/**
 * Takes a string, remove the dash ("-") and capitalized it.
 * @param name The string to convert.
 * @returns The capitalized string.
 * @example
 * toOptions('hello-world') // 'Hello World'
 */
export function toOptions(name: string) {
    const title = name
        .split('-')
        .map(function (str: string) {
            // replace any character at the begining of the word by its capital value.
            return str.replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
        })
        .join(' ');
    return title;
}