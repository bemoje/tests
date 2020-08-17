/**
 * Node.js based micro testing framwork with powerful features to more efficiently get those tests over with.
 * Focus on lightweight testing tiny micro standalone node library modules.
 * Init automated and not dependent on any plugins to work.
 * Make errors and stack traces visually easy to read.
 * Tries to be scalable to other testing platforms, eventually, hopefully, by automated code refactoring..
 * Parses module exports in source code of sorrrounding files and builds a template from that to get going quickly.
 * Command-line interface with no parameters. Should figure out what you are trying to do with it by itself, as it doesn't to a lot of fancy stuff - just the basics..
 * Beginner-friendly for sure.
 * @module tests
 */

// module loader on require
require = require('esm')(module)

// native node imports
import fs from 'fs'
import path from 'path'

// imports
import chalk from 'chalk'
import camelcase from 'camelcase'
import arrFlatten from '@bemoje/arr-flatten'

// local module imports
import { parseEsmSourceCodeExports } from '../regex/regex'

// pretty stack trace
import { prettyStackTrace, stackTracing } from '../rod/exit-handling'

// enable pretty stack trace globally
stackTracing()

// stats
let totalFail = 0
let totalPass = 0
let totalFunctions = 0
let totalFunctionsCompleted = 0

// Test constructor
class test {
	constructor(info, ...testArgs) {
		testArgs = arrFlatten(testArgs)

		this.isRoot = true
		this.depth = 0
		this.info = info
		this.children = []

		for (const arg of testArgs) {
			if (typeof arg === 'function') {
				totalFunctions++
				const func = arg
				Object.defineProperty(func, 'name', {
					configurable: true,
					value: info,
				})
				try {
					const maybePromise = func(...this.initArgs())
					if (maybePromise && maybePromise.then) {
						totalFunctionsCompleted--
						maybePromise
							.then(() => {
								totalPass++
								totalFunctionsCompleted++
							})
							.catch((e) => {
								totalFail++
								prettyStackTrace.call(e, false)
								totalFunctionsCompleted++
							})
					} else {
						totalPass++
					}
				} catch (e) {
					totalFail++
					prettyStackTrace.call(e, false)
				}
				totalFunctionsCompleted++
			} else {
				this.children.push(arg)
				this[arg.info] = arg
				arg.notRoot()
				arg.upDepth()
			}
		}
		setImmediate((self) => {
			if (self.isRoot) {
				self.finalReport()
			}
		}, this)
	}

	initArgs() {
		const o = {}
		const arr = []
		const n = 0
		const str = ''
		class ctor {
			constructor(arg) {
				this.arg = arg
			}
		}
		return [o, arr, n, str, ctor]
	}

	get indent() {
		let ret = ''
		for (let i = 0; i < this.depth; i++) {
			ret += '   '
		}
		return ret
	}

	upDepth() {
		this.depth++
		for (const child of this.children) {
			child.upDepth()
		}
	}

	notRoot() {
		this.isRoot = false
	}

	finalReport() {
		setTimeout(() => {
			if (totalFunctions === totalFunctionsCompleted) {
				console.log(chalk.green.bold('PASS: ' + totalPass))
				if (totalFail) {
					console.log(chalk.red.bold('FAIL: ' + totalFail))
				}
			} else {
				finalReport()
			}
		}, 100)
	}
}

// globals
const tdes = {
	configurable: true,
	value: function T(...args) {
		return new test(...args)
	},
}

Object.defineProperties(global, {
	TEST: tdes,
	test: tdes,
	t: tdes,
	T: tdes,
	assert: {
		configurable: true,
		value: require('chai').assert,
	},
})

const assertMethodNames = []
for (const name of Object.keys(assert)) {
	if (name !== 'assert' && global[name] === undefined) {
		Object.defineProperty(global, name, {
			configurable: true,
			value: assert[name],
		})
		assertMethodNames.push(name)
	}
}

// cli main

const CLI_ARGS = process.argv.slice(2)

const resolveCwdJoin = (...paths) => path.join(process.cwd(), ...paths)

const assertPath = (filepath) => {
	if (!fs.existsSync(filepath)) {
		throw Error('Cannot find file: ' + filepath)
	}
	return filepath
}

const pkgPath = assertPath(resolveCwdJoin('package.json'))
const pkg = require(pkgPath)
const testPath = resolveCwdJoin('test.js')
const modulePath = assertPath(resolveCwdJoin(pkg.module))
const modulePathRelative = assertPath('./' + pkg.module)

// console.log({pkgPath,testPath,modulePath,modulePathRelative})

if (CLI_ARGS.includes('--init')) {
	if (pkg.scripts === undefined) {
		pkg.scripts = {}
	}
	pkg.scripts.test = 'tests'
	if (pkg.devDependencies === undefined) {
		pkg.devDependencies = {}
	}
	pkg.devDependencies['@bemoje/tests'] = '*'
	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8')
}

if (fs.existsSync(testPath)) {
	require(testPath)
} else {
	// source code
	const src = fs.readFileSync(modulePath).toString()

	// parsed named and default exports
	let { defaultExport, namedExports } = parseEsmSourceCodeExports(src)
	const isSingleDefault = defaultExport.length === 1

	// generate lib import name if multiple default export names
	let moduleImportName = camelcase(
		pkg.name
			.split(/\@|\//g)
			.filter((s) => !!s)
			.pop(),
	)

	//console.log({ moduleImportName, defaultExport, isSingleDefault, namedExports })

	const testsDefaultExport = defaultExport.map(
		(name) =>
			`\n    T('${name}', (o, arr, n, str, ctor) => {\n      assert(${
				isSingleDefault ? moduleImportName : moduleImportName + '.' + name
			})\n    })`,
	)

	const testsNamedExports = namedExports.map(
		(name) =>
			`\n    T('${name}', (o, arr, n, str, ctor) => {\n      assert(${name})\n    })`,
	)

	const result = `\nimport ${moduleImportName} from  "${modulePathRelative}";\n\nimport { ${namedExports.join(
		', ',
	)} } from "${modulePathRelative}"\n\nT("${defaultExport}", [\n  T("default export", [${testsDefaultExport}\n  ]),\n  T('named exports', [${testsNamedExports}\n  ])\n])\n\n//assert: ${assertMethodNames.join(
		', ',
	)}`

	fs.writeFileSync(testPath, result, 'utf8')

	console.log('\nModule tests template generated: ' + testPath + '\n')

	require(testPath)
}
