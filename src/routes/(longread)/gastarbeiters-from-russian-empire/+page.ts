import { extractMdxMeta } from '$lib'
import page from './+page.md?raw'
import image from './image.webp'

export const load = () => {
    return { ...extractMdxMeta(page), image }
}
