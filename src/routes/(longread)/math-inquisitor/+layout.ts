import { extractMdxMeta } from '$lib'
import page   from './+page.md?raw'
import banner from './banner.webp'
import image  from './image.webp'

//const banner = undefined
//const image = undefined

export const load = () => {
    return { ...extractMdxMeta(page), image, banner  }
}
