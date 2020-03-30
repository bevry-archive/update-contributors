import { resolve } from 'path'
import updateContributors from './index'

updateContributors(resolve(process.cwd(), 'package.json'))
