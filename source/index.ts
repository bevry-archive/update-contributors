import {
	getContributorsFromRepoContributorData,
	Fellow,
} from '@bevry/github-contributors'
import { readJSON, writeJSON } from '@bevry/json'
import { getGitHubRepoSlug, SluggablePackage } from './util.js'

interface Package extends SluggablePackage {
	name?: string
	author?: string
	authors?: string | Array<string>
	contributors?: Array<string>
	maintainers?: Array<string>
}

export default async function updateContributors(path: string) {
	let localCount = 0,
		remoteCount = 0

	// read
	const pkg: Package = await readJSON<Package>(path)

	// slug
	const githubRepoSlug = getGitHubRepoSlug(pkg)
	const slug = githubRepoSlug || pkg.name
	if (!slug) {
		console.error(path, pkg)
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
			const added = await getContributorsFromRepoContributorData(githubRepoSlug)
			remoteCount = added.size
		} catch (err) {
			console.warn(err)
			console.warn(
				`FAILED to fetch the remote contributors for the repository: ${githubRepoSlug}`
			)
		}
	}

	// update the data with the converged data
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
		.sort()
	pkg.maintainers = Fellow.maintainsRepository(slug)
		.map((fellow) =>
			fellow.toString({ displayEmail: true, urlFields: ['githubUrl', 'url'] })
		)
		.sort()

	// clean up in case empty
	if (!pkg.author) delete pkg.author
	if (pkg.contributors.length === 0) delete pkg.contributors
	if (pkg.maintainers.length === 0) delete pkg.maintainers

	// write it
	await writeJSON(path, pkg)

	// done
	console.log(
		`Updated contributors (${localCount} local, ${remoteCount} remote) on [${path}]`
	)
}
