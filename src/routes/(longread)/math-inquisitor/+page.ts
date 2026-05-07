import { extractMdxMeta } from '$lib'
import page from './story.md?raw'
import src01 from './graph.webp'
import banner from './banner.webp'
import image from './image.webp'

const sources = [ src01 ]

export const load = () => {
    return { ...extractMdxMeta(page), sources,  image, banner  }
}
