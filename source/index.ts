import { getContributorsFromRepo, Fellow } from 'getcontributors'
import {
	getGitHubRepoSlug,
	SluggablePackage,
	readJSONFile,
	writeJSONFile,
} from './util.js'

interface Package extends SluggablePackage {
	name?: string
	author?: string
	authors?: string | Array<string>
	contributors?: Array<string>
	maintainers?: Array<string>
}

export default async function updateContributors(path: string) {
	let pkg: Package,
		localCount = 0,
		remoteCount = 0

	// read
	try {
		pkg = await readJSONFile<Package>(path)
	} catch (err) {
		console.error(err)
		throw new Error(`FAILED to read: ${path}`)
	}

	// slug
	const githubRepoSlug = getGitHubRepoSlug(pkg)
	const slug = githubRepoSlug || pkg.name
	if (!slug) {
		throw new Error('package needs at least a name to identify it uniquely')
	}

	// Add local people to the singleton with their appropriate permissions
	Fellow.add(pkg.author, pkg.authors).forEach((person) => {
		person.authoredRepositories.add(slug)
	})
	Fellow.add(pkg.contributors).forEach((person) => {
		person.contributedRepositories.add(slug)
	})
	Fellow.add(pkg.maintainers).forEach((person) => {
		person.maintainedRepositories.add(slug)
	})
	localCount = Fellow.fellows.length

	// Enhance authors, contributors and maintainers with latest remote data
	if (githubRepoSlug) {
		try {
			const added = await getContributorsFromRepo(githubRepoSlug)
			remoteCount = added.size
		} catch (err) {
			console.warn(err)
			console.log(
				`FAILED to fetch the remote contributors for the repository: ${githubRepoSlug}`
			)
		}
	}

	// update the data with the coverged data
	delete pkg.authors
	pkg.author = Fellow.authorsRepository(slug)
		.map((fellow) =>
			fellow.toString({ displayYears: true, displayEmail: true })
		)
		.join(', ')
	pkg.contributors = Fellow.contributesRepository(slug)
		.map((fellow) =>
			fellow.toString({ displayEmail: true, urlFields: ['githubUrl', 'url'] })
		)
		.filter((entry) => entry.includes('[bot]') === false)
	pkg.maintainers = Fellow.maintainsRepository(slug).map((fellow) =>
		fellow.toString({ displayEmail: true, urlFields: ['githubUrl', 'url'] })
	)

	// clean up in case empty
	if (!pkg.author) delete pkg.author
	if (pkg.contributors.length === 0) delete pkg.contributors
	if (pkg.maintainers.length === 0) delete pkg.maintainers

	// write it
	try {
		await writeJSONFile(path, pkg)
	} catch (err) {
		console.error(err)
		throw new Error(`FAILED to write: ${path}`)
	}

	// done
	console.log(
		`Updated contributors (${localCount} local, ${remoteCount} remote) on [${path}]`
	)
}
