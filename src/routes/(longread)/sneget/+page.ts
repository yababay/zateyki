import { extractMdxMeta } from '$lib'
import page from './+page.md?raw'

export const load = () => {
    return { ...extractMdxMeta(page)  }
}
