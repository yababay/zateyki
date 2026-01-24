import db from '$lib/assets/atlas.json'

const regions = new Map(db)

export const load = ( { params } ) => {
    const { year, page } = params
    const key = `atlas-${year}-${page}`
    const value = regions.get(key)
    const { title, width, height } = value
    return { key, title, width, height }
}

export const trailingSlash = 'never';
