declare module "regex/regex" {
    /**
     * Javascript Number type, but known to be an integer.
     * Specifically, as in that invoking Number.isInteger on it would return true.
     * @typedef {number} integer
     */
    /**
     * Easily perform regex 'exec' on a string. An iterable is returned which steps through the exec process and yields all
     * the details you might need.
     * @generator
     * @param {RegExp} regex - The regular expression object
     * @param {*} str - The string to perform the operation on
     * @returns {iterable}
     * @yields {Array<{index:integer, match:string, groups:object, lastIndex: integer}>}
     *
     * @example
       const regex = /(?<group1>a)|(?<group2>d)/g
        const str = 'Anthony wants a girlfriend.'
    
        // The quick one
        console.log([...rexec(regex, str)])
        // [
        // 	[9, 'a', { group1: 'a', group2: undefined }, 10],
        // 	[14, 'a', { group1: 'a', group2: undefined }, 15],
        // 	[25, 'd', { group1: undefined, group2: 'd' }, 26],
        // ]
    
        // Or for... of
        const iterable = rexec(regex, str)
    
        for (let [index, match, groups, lastIndex] of iterable) {
            console.log({ index, match, groups, lastIndex })
        }
        //	{
        //		index: 9,
        //		match: 'a',
        //		groups: { group1: 'a', group2: undefined },
        //		lastIndex: 10,
        //	}
        //	{
        //		index: 14,
        //		match: 'a',
        //		groups: { group1: 'a', group2: undefined },
        //		lastIndex: 15,
        //	}
        //	{
        //		index: 25,
        //		match: 'd',
        //		groups: { group1: undefined, group2: 'd' },
        //		lastIndex: 26,
        //	}
     */
    export function rexec(regex: RegExp, str: any): any;
    /**
     * Run exec on a regular expression with 'str' as argument, accumulating all matches into arrays by group name
     * @param {RegExp} regex - The regular expression object
     * @param {*} str - The string to perform the operation on
     * @returns {object} matches accumulated by group name
     */
    export function accumulateGroups(regex: RegExp, str: any): object;
    /**
     * Parse a regular expression object's group names
     * @param {RegExp} regex - The regular expression object
     * @returns {Array<string>} group names
     */
    export function parseRegexGroupNames(regex: RegExp): Array<string>;
    /**
     * Parse default export and named exports from es module source code
     * @param {string} esmSource - The es module source code
     * @returns {object {named: Array<string>, default:Array<string>  }}
     * @example
     * parseEsmSourceCodeExports(`export let letVar = 93
       export var varVar = 51
    
       export const add = function (n1, n2) {
        return n1 + n2
       }
    
       export function sub(n1, n2) {
        return n1 - n2
       }
    
       function mul(n1, n2) {
        return n1 * n2
       }
    
       function div(n1, n2) {
        return n1 / n2
       }
    
       export { mul, div }
    
       export default { add, sub, mul, div }
       `)
       // {
       //   defaultExport: [ 'ZERO1', 'ZERO2', 'add', 'sub', 'mul', 'div' ],
       //   namedExports: [ 'add', 'sub', 'mul', 'div' ]
       // }
     */
    export function parseEsmSourceCodeExports(esmSource: string): object;
    /**
     * Useful RegExp objects
     * @constant {RegexBank} bank
     */
    export const bank: {
        /**
         * Store a RegExp object in the bank.
         * @param {string} name - The unique id / name for the RegExp object.
         * @param {string} info - provide additional information
         * @param {RegExp} regex - The RegExp object
         * @returns {RegexBank} this/self as to be chainable
         */
        save(name: string, info: string, regex: RegExp): any;
        /**
         * Print all regexes in the bank to console.
         * @returns {void}
         */
        print(): void;
    };
    /**
     * A class of various static methods for parsing using regular expressions from the regex bank. @see bank
     * @class parse
     */
    export const parse: any;
    namespace _default {
        export { bank };
        export { rexec };
        export { accumulateGroups };
        export { parse };
    }
    export default _default;
    /**
     * Javascript Number type, but known to be an integer.
     * Specifically, as in that invoking Number.isInteger on it would return true.
     */
    export type integer = number;
}
declare module "rod/exit-handling" {
    /**
     * Add an event handler for node process event: 'exit'
     * Fired when app is closing
     * @param {process-exit-event-handler} handler - handler('exit', exitCode)
     * @returns {void}
     */
    export function onExit(handler: any): void;
    /**
     * Add an event handler for node process events: 'SIGUSR1', 'SIGUSR2' and 'SIGINT'
     * Catches "kill pid" (for example: nodemon restart) and terminal ctrl+c events.
     * @param {process-exit-event-handler} handler - handler('kill', exitCode)
     * @returns {void}
     */
    export function onKill(handler: any): void;
    /**
     * Add an event handler for node process event: 'uncaughtException'
     * @param {process-error-event-handler} handler - handler('error', exitCode)
     * @returns {void}
     */
    export function onError(handler: any): void;
    /**
     * Node process exit event handler
     * @callback process-exit-event-handler
     * @param {object} e - event object
     * @returns {void}
     */
    /**
     * Node process error event handler
     * @callback process-error-event-handler
     * @param {string} message - The error message
     * @param {string} stack - The stack trace
     * @returns {void}
     */
    export function prettyStackTrace(exitProcess?: boolean): void;
    /**
     * Enable pretty console print of the stack trace, but also extracted source code, defined by the stack trace are
     * printed as well, so the Error can be followed across multiple files for the whole trace.
     * @returns {void}
     */
    export function stackTracing(): void;
    namespace _default {
        export { onExit };
        export { onKill };
        export { onError };
        export { stackTracing };
    }
    export default _default;
    /**
     * Node process exit event handler
     */
    export type _process_exit_event_handler = (e: object) => void;
    /**
     * Node process error event handler
     */
    export type _process_error_event_handler = (message: string, stack: string) => void;
}
declare module "tests/tests" {
    export {};
}
