'use strict';

var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var camelcase = require('camelcase');
var arrFlatten = require('@bemoje/arr-flatten');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var camelcase__default = /*#__PURE__*/_interopDefaultLegacy(camelcase);
var arrFlatten__default = /*#__PURE__*/_interopDefaultLegacy(arrFlatten);

/**
 * Various utility for or related to javascript regular expression RegExp objects.
 * @module regex
 * @author Benjamin M. Jensen
 * @version 0.0.1
 * @date 2020-08-15
 * @npm install --save @bemoje/regex
 */

const parseRegexGroupNamesRegex = /\(\?<(?<groupName>\w+)>/g;
const parseEsmSourceCodeExportsRegex = /export\s?(?<isDefault>default\s?)?(\{((?<name1>[^}]*)(,|\s)*)+\}|(const|var|let|function)\s?(?<name2>\w+)|(?<name3>\w+))/g;

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
function* rexec(regex, str) {
	let arr;
	while ((arr = regex.exec(str)) !== null) {
		yield [arr.index, arr[0], arr.groups, regex.lastIndex];
	}
}

/**
 * Run exec on a regular expression with 'str' as argument, accumulating all matches into arrays by group name
 * @param {RegExp} regex - The regular expression object
 * @param {*} str - The string to perform the operation on
 * @returns {object} matches accumulated by group name
 */
function accumulateGroups(regex, str) {
	let groupNames;
	return [...rexec(regex, str)].reduce((accum, res, i) => {
		const groups = res[2];

		if (i === 0) {
			groupNames = Object.keys(groups);
			for (const name of groupNames) {
				accum[name] = [];
			}
		}

		for (const name of groupNames) {
			if (groups[name]) {
				accum[name].push(groups[name]);
			}
		}

		return accum
	}, Object.create(null))
}

/**
 * Useful RegExp objects
 * @constant {RegexBank} bank
 */
const bank = new (class RegexBank {
	/**
	 * Store a RegExp object in the bank.
	 * @param {string} name - The unique id / name for the RegExp object.
	 * @param {string} info - provide additional information
	 * @param {RegExp} regex - The RegExp object
	 * @returns {RegexBank} this/self as to be chainable
	 */
	save(name, info, regex) {
		if (this[name] !== undefined) {
			throw new Error('name in use')
		}

		this[name] = {
			info,
			groups: accumulateGroups(parseRegexGroupNamesRegex, regex.source)
				.groupName,
			regex,
		};

		return this
	}

	/**
	 * Print all regexes in the bank to console.
	 * @returns {void}
	 */
	print() {
		console.log(this);
		return this
	}
})();

/**
 * A class of various static methods for parsing using regular expressions from the regex bank. @see bank
 * @class parse
 */
const parse = Object.create(null);

//

bank.save(
	'parseRegexGroupNames',
	'parse a regular expression object for its group names',
	parseRegexGroupNamesRegex,
);

/**
 * Parse a regular expression object's group names
 * @param {RegExp} regex - The regular expression object
 * @returns {Array<string>} group names
 */
function parseRegexGroupNames(regex) {
	return accumulateGroups(parseRegexGroupNamesRegex, regex.source).groupName
}

//

bank.save(
	'parseEsmSourceCodeExports',
	'parse es module source code for named exports and default exports',
	parseEsmSourceCodeExportsRegex,
);

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
function parseEsmSourceCodeExports(esmSource) {
	const res = [...rexec(parseEsmSourceCodeExportsRegex, esmSource)];

	const namedExports = new Set();
	const defaultExport = new Set();

	res.forEach((r) => {
		let { isDefault, name1, name2, name3 } = r[2];

		name1 = name1 || '';
		isDefault = isDefault !== undefined;

		const names = Array.from(
			new Set([...name1.split(/,|\r?\n|\s|\t/g), name2, name3]),
		).filter((e) => !!e && e.trim() !== 'default');

		if (names.length) {
			if (isDefault) {
				for (const name of names) {
					defaultExport.add(name);
				}
			} else {
				for (const name of names) {
					namedExports.add(name);
				}
			}
		}

		//console.log('\n--------------\n' + r[1] + '\n')
		//console.log({ isDefault, names })
	});

	return {
		namedExports: Array.from(namedExports),
		defaultExport: Array.from(defaultExport),
	}
}

//

parse.regexGroupNames = parseRegexGroupNames;
parse.esmSourceCodeExports = parseEsmSourceCodeExports;

/**
 * Easily set up exit node-js process event handlers.
 * Features a stack trace parser that compiles the trace in source code, too and displays it nicely in the terminal with
 * clickable links to open files.
 * @module exit-handling
 * @version 0.0.1
 * @date 2020-08-06
 * @license MIT
 * @author Benjamin M Jensen <bemoje@gmail.com>
 * @npm install --save-dev @bemoje/exit-handling
 */

process.on('SIGUSR1', function (e) {
	process.emit('kill', e);
	process.exit(2, e);
});

process.on('SIGUSR2', function (e) {
	process.emit('kill', e);
	process.exit(2, e);
});

process.on('SIGINT', function (e) {
	process.emit('kill', e);
	process.exit(2, e);
});

process.on('uncaughtException', function (e) {
	process.emit('error', e);
	process.exit(99, e);
});

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

function prettyStackTrace(exitProcess = true) {
	const chalk = require('chalk');
	const { parse, normalize } = require('path');
	const { readFileSync } = require('fs');

	const errorType = this.constructor.name;
	const errorMessage = this.message;

	const normalizePath = (str) => normalize(str).replace(/\\\\?/g, '/');
	const splitSlashes = (str) => str.split(/\\\\?|\//g);

	const dashes = chalk.gray(
		'---------------------------------------------------------------',
	);
	const accents = chalk.gray(
		'^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
	);
	const lodashes = chalk.gray(
		'\n_______________________________________________________________\n',
	);

	const colorIndexMap = [
		chalk.red,
		chalk.yellow,
		chalk.magenta,
		chalk.cyan,
		chalk.green,
		chalk.blue,
		chalk.white,
	];

	colorIndexMap.push(...colorIndexMap);
	colorIndexMap.push(...colorIndexMap);
	colorIndexMap.push(...colorIndexMap);

	const cols = {
		i: [],
		cwd: [],
		cwdname: [],
		dirpath: [],
		file: [],
		fn: [],
		line: [],
		col: [],
	};

	const pathLinks = [];
	const context = [];

	// i, fn
	const match1 = this.stack.match(/(\w+)@|at (\w+) \(/g) || [];

	for (let i = 0, len = match1.length; i < len; i++) {
		let str = match1[i];
		cols.i.push(i);
		cols.fn.push(str.replace(/ \(|(\w+)@|at /gi, ''));
	}

	// path, line, col
	const match2 = this.stack.match(/\((.*)\)/g) || [];
	for (let i = 0, len = match2.length; i < len; i++) {
		// line and column. always true: col, line are at the and and are 2 of the splits.
		let arr = Array.from(match2[i].substr(1));
		arr.pop();
		arr = arr.join('').split(':');

		// col #
		const col = arr.pop();

		// line #
		const line = arr.pop();

		// verify path
		let filepath = arr.join(':');
		if (!filepath) continue

		// path stuff
		const cwdNorm = normalizePath(process.cwd());
		const cwdSplit = splitSlashes(cwdNorm);
		const cwdSplitLen = cwdSplit.length;

		const cwdname = cwdSplit.pop();
		const cwd = cwdSplit.join('/');

		// path parsing
		filepath = normalizePath(filepath);
		const parsed = parse(filepath);

		// remove everything before cwd
		const dirpath = parsed.dir;
		const file = parsed.base;

		// push data
		cols.dirpath.push(dirpath);
		cols.file.push(file);
		cols.line.push(line);
		cols.col.push(col);

		pathLinks.push([dirpath, '/', file, ':', line, ':', col]);

		let fname = cols.fn[i];
		if (!fname) continue
		fname = fname.replace('new ', '').split(' ').pop();

		// get source code and split lines
		const source = readFileSync(filepath, 'utf8');
		const lines = source.replace(/\t/g, '  ').split(/\r?\n/g);

		let l = Number(line);
		let strLine = lines[l];
		let ctx = [];
		let fnRe = new RegExp(fname, 'gi');
		const maxNeededPadLen = lines.length.toString().length;

		while (l >= 0 && !fnRe.test(strLine)) {
			let paddedLineNum =
				Number(l + 1)
					.toString()
					.padStart(maxNeededPadLen, ' ') + '| ';
			strLine = paddedLineNum + lines[l];
			ctx.unshift(strLine.substr(0, 120));
			l--;
		}
		if (l <= 1) {
			ctx = ctx.slice(ctx.length - 8);
			ctx.unshift('   |');
			ctx.unshift('...| (cap)');
		}

		ctx.pop();
		const errLine = lines[line - 1];
		const errFnNameEnd = errLine.indexOf('(', col);
		const errFnName = errLine
			.substring(col, errFnNameEnd)
			.replace('new ', '')
			.split(' ')
			.pop();
		if (ctx.length) {
			ctx[ctx.length - 1] = ctx[ctx.length - 1]
				.split(errFnName)
				.map((s) => chalk.gray(s))
				.join(colorIndexMap[i](errFnName));

			ctx[0] = ctx[0]
				.split(fname)
				.map((s) => chalk.gray(s))
				.join(colorIndexMap[i + 1](fname));
		}

		ctx = ctx.map((str, i) => {
			return ctx.length - 1 !== i && i !== 0 ? chalk.gray(str) : str
		});

		ctx.unshift(accents);
		ctx.push(
			[
				chalk.black(dirpath + '/'),
				chalk.gray(file + ':'),
				colorIndexMap[i](line + ':' + col),
			].join(''),
		);
		ctx = ctx.join('\n');
		context[i] = ctx;
	}

	// code context
	console.log(
		'\n\n\n\n\n' +
			chalk.cyan.bold(
				'\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\n',
			) +
			chalk.red.bold('  ERROR') +
			chalk.green.bold(
				'                                            STACK TRACE\n',
			) +
			chalk.cyan(
				'///////////////////////////////////////////////////////////////\n',
			) +
			context.reverse().join(lodashes) +
			lodashes +
			accents,
	);

	// file links
	const map = [
		chalk.gray,
		chalk.gray,
		chalk.cyan,
		chalk.gray,
		chalk.red.bold,
		chalk.gray,
		chalk.gray,
	];

	let cnt = -1;

	const paths = pathLinks.map((arr, idxPath) => {
		return arr

			.map((str, i) => {
				return map[i](str.replace(/\/|\\\\?/g, chalk.gray('/')))
			})
			.join('')
	});

	paths.reverse();
	cnt = paths.length;

	paths.forEach((arr, i) => {
		// count
		cnt += -1;

		// print
		const err = chalk.red.bold('Err');
		let strIndex = cnt === 0 ? err : chalk.gray(' ' + cnt + ' ');
		console.log('[' + strIndex + '] ' + arr);
	});

	// message
	console.log(
		lodashes +
			accents +
			'\n' +
			cols.fn
				.slice()
				.reverse()
				.map((s, i) => {
					if (i !== cols.fn.length - 1) {
						return chalk.green(s)
					} else {
						return chalk.red(s)
					}
				})
				.join(chalk.gray('()  >  ')) +
			chalk.gray('()\n') +
			chalk.red.bold(errorType) +
			chalk.gray(': ') +
			chalk.yellow(errorMessage) +
			lodashes +
			accents +
			'\n\n',
	);

	if (exitProcess) {
		process.exit(99, this);
	}
}

// native node imports

require = require('esm')(module /* , options */);

// pretty stack trace
//stackTracing()

// stats
let totalFail = 0;
let totalPass = 0;
let totalFunctions = 0;
let totalFunctionsCompleted = 0;

// Test constructor
class test {
	constructor(info, ...testArgs) {
		testArgs = arrFlatten__default['default'](testArgs);

		this.isRoot = true;
		this.depth = 0;
		this.info = info;
		this.children = [];

		for (const arg of testArgs) {
			if (typeof arg === 'function') {
				totalFunctions++;
				const func = arg;
				Object.defineProperty(func, 'name', {
					configurable: true,
					value: info,
				});
				try {
					const maybePromise = func(...this.initArgs());
					if (maybePromise && maybePromise.then) {
						totalFunctionsCompleted--;
						maybePromise
							.then(() => {
								totalPass++;
								totalFunctionsCompleted++;
							})
							.catch((e) => {
								totalFail++;
								prettyStackTrace.call(e, false);
								totalFunctionsCompleted++;
							});
					} else {
						totalPass++;
					}
				} catch (e) {
					totalFail++;
					prettyStackTrace.call(e, false);
				}
				totalFunctionsCompleted++;
			} else {
				this.children.push(arg);
				this[arg.info] = arg;
				arg.notRoot();
				arg.upDepth();
			}
		}
		setImmediate((self) => {
			if (self.isRoot) {
				self.finalReport();
			}
		}, this);
	}

	initArgs() {
		const o = {};
		const arr = [];
		const n = 0;
		const str = '';
		class ctor {
			constructor(arg) {
				this.arg = arg;
			}
		}
		return [o, arr, n, str, ctor]
	}

	get indent() {
		let ret = '';
		for (let i = 0; i < this.depth; i++) {
			ret += '   ';
		}
		return ret
	}

	upDepth() {
		this.depth++;
		for (const child of this.children) {
			child.upDepth();
		}
	}

	notRoot() {
		this.isRoot = false;
	}

	finalReport() {
		setTimeout(() => {
			if (totalFunctions === totalFunctionsCompleted) {
				console.log(chalk__default['default'].green.bold('PASS: ' + totalPass));
				if (totalFail) {
					console.log(chalk__default['default'].red.bold('FAIL: ' + totalFail));
				}
			} else {
				finalReport();
			}
		}, 100);
	}
}

// globals
const tdes = {
	configurable: true,
	value: function T(...args) {
		return new test(...args)
	},
};

Object.defineProperties(global, {
	TEST: tdes,
	test: tdes,
	t: tdes,
	T: tdes,
	assert: {
		configurable: true,
		value: require('chai').assert,
	},
});

const assertMethodNames = [];
for (const name of Object.keys(assert)) {
	if (name !== 'assert' && global[name] === undefined) {
		Object.defineProperty(global, name, {
			configurable: true,
			value: assert[name],
		});
		assertMethodNames.push(name);
	}
}

// cli main

const CLI_ARGS = process.argv.slice(2);

const resolveCwdJoin = (...paths) => path__default['default'].join(process.cwd(), ...paths);

const assertPath = (filepath) => {
	if (!fs__default['default'].existsSync(filepath)) {
		throw Error('Cannot find file: ' + filepath)
	}
	return filepath
};

const pkgPath = assertPath(resolveCwdJoin('package.json'));
const pkg = require(pkgPath);
const testPath = resolveCwdJoin('test.js');
const modulePath = assertPath(resolveCwdJoin(pkg.module));
const modulePathRelative = assertPath('./' + pkg.module);

// console.log({pkgPath,testPath,modulePath,modulePathRelative})

if (CLI_ARGS.includes('--init')) {
	if (pkg.scripts === undefined) {
		pkg.scripts = {};
	}
	pkg.scripts.test = 'tests';
	if (pkg.devDependencies === undefined) {
		pkg.devDependencies = {};
	}
	pkg.devDependencies['@bemoje/tests'] = '*';
	fs__default['default'].writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
}

if (fs__default['default'].existsSync(testPath)) {
	require(testPath);
} else {
	// source code
	const src = fs__default['default'].readFileSync(modulePath).toString();

	// parsed named and default exports
	let { defaultExport, namedExports } = parseEsmSourceCodeExports(src);
	const isSingleDefault = defaultExport.length === 1;

	// generate lib import name if multiple default export names
	let moduleImportName = camelcase__default['default'](
		pkg.name
			.split(/\@|\//g)
			.filter((s) => !!s)
			.pop(),
	);

	//console.log({ moduleImportName, defaultExport, isSingleDefault, namedExports })

	const testsDefaultExport = defaultExport.map(
		(name) =>
			`\n    T('${name}', (o, arr, n, str, ctor) => {\n      assert(${
				isSingleDefault ? moduleImportName : moduleImportName + '.' + name
			})\n    })`,
	);

	const testsNamedExports = namedExports.map(
		(name) =>
			`\n    T('${name}', (o, arr, n, str, ctor) => {\n      assert(${name})\n    })`,
	);

	const result = `${
		defaultExport
			? `\nimport ${moduleImportName} from  "${modulePathRelative}";\n`
			: '\n'
	}\nimport { ${namedExports.join(
		', ',
	)} } from "${modulePathRelative}"\n\nT("${defaultExport}", [\n  T("default export", [${testsDefaultExport}\n  ]),\n  T('named exports', [${testsNamedExports}\n  ])\n])\n\n//assert: ${assertMethodNames.join(
		', ',
	)}`;

	fs__default['default'].writeFileSync(testPath, result, 'utf8');

	console.log('\nModule tests template generated: ' + testPath + '\n');

	require(testPath);
}
