import { resolve } from 'path'
import updateContributors from './index.js'
import { cwd } from 'process'

updateContributors(resolve(cwd(), 'package.json'))
