export const extractMdxMeta = (page: string) => {
    const iof = page.lastIndexOf('---')
    if(iof === -1) return {}
    const arr = page.substring(0, iof).split(/[\r\n]+/)

    const getMeta = (meta: string): string => {
        const toFind = `${meta}:`
        const lines = arr.filter(el => el.includes(toFind))
        const [ line ] = lines
        if(!line) return ''
        return line.replace(toFind, '').trim()
    }

    const title = getMeta('title')
    const description = getMeta('description') 
    const canonical = getMeta('canonical') 
    return { title, description, canonical }
}