import { page } from '$app/state';

export const headState = $state({
    title: '',
    description: '',
    banner: '',
})

const ROOT_PATHS = [ '/', '', '/zateyki', '/zateyki/']

export function isRoot(): boolean {
	return ROOT_PATHS.includes(page.url.pathname.trim());
}
