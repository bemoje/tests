import pkg from './package.json'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import camelcase from 'camelcase'

const [scope, packageName] = pkg.name.split(/\@|\//g).filter((s) => !!s)
const exportsName = camelcase(packageName)
const sourceEntry = packageName + '.js'

const external = Object.keys(pkg.dependencies).concat(
	...require('builtin-modules'),
)

const CONFIG = []

if (pkg.main) {
	CONFIG.push({
		input: sourceEntry,
		external,
		output: [{ file: pkg.main, format: 'cjs' }],
		plugins: [resolve(), commonjs()],
	})
}

if (pkg.module) {
	CONFIG.push({
		input: sourceEntry,
		external,
		output: [{ file: pkg.module, format: 'es' }],
		plugins: [resolve(), commonjs()],
	})
}

if (pkg.browser) {
	CONFIG.push({
		input: sourceEntry,
		output: {
			name: exportsName,
			file: pkg.browser,
			format: 'umd',
		},
		plugins: [resolve(), commonjs()],
	})
}

export default CONFIG
