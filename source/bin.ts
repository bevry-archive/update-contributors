import { resolve } from 'path'
import updateContributors from './index.js'

updateContributors(resolve(process.cwd(), 'package.json'))
