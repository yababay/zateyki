import { extractMdxMeta } from '$lib'
import page from './+page.md?raw'
import image from './image.webp'
import banner from './banner.webp'

export const load = () => {
    return { ...extractMdxMeta(page),  image, banner  }
}
