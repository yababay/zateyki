import { extractMdxMeta } from '$lib'
import page from './+page.md?raw'

export const load = () => {
    const { title, description, canonical } = extractMdxMeta(page)
    return { title, description, canonical }
}
