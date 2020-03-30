import { promises as fsPromises } from 'fs'
const { readFile, writeFile } = fsPromises

export async function readJSONFile<T extends object>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf8'))
}

export async function writeJSONFile(path: string, data: object) {
	await writeFile(path, JSON.stringify(data, null, '  ') + '\n')
}

export interface SluggablePackage {
	homepage?: string
	repository?: string | { url?: string }
}

export function getGitHubRepoSlug(pkg: SluggablePackage) {
	let match = null
	if (typeof pkg.repository === 'string') {
		match = pkg.repository.match(/^(?:github:)?([^/:]+\/[^/:]+)$/)
	} else {
		let url = null
		if (pkg.repository && typeof pkg.repository.url === 'string') {
			url = pkg.repository && pkg.repository.url
		} else if (typeof pkg.homepage === 'string') {
			url = pkg.homepage
		} else {
			return null
		}
		match = url.match(/github\.com\/([^/:]+\/[^/:]+?)(?:\.git|\/)?$/)
	}
	return (match && match[1]) || null
}
