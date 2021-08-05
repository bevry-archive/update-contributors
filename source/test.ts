import kava from 'kava'
import updateContributors from './index.js'
import { resolve } from 'path'

import filedirname from 'filedirname'
const [filename, dirname] = filedirname()
const pkgPath = resolve(dirname, '..', 'package.json')

kava.suite('update-contributors', function (suite, test) {
	test('does not fail', function (done) {
		updateContributors(pkgPath)
			.then(() => done())
			.catch(done)
	})
})
