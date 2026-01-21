import { extractMdxMeta } from '$lib'
import page from './+page.svx?raw'

export const load = async () => {
    const meta = extractMdxMeta(page);
    return { ...meta }
}
