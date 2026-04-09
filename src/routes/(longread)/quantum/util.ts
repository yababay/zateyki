import type { HistoricalEvent, HistoricalEvents, HistoricalStages } from './types'

const HEADER_HEIGHT = 36
const LINE_HEIGHT = 24
const SEMI_HEADER_HEIGHT = HEADER_HEIGHT / 2
const SEMI_LINE_HEIGHT = LINE_HEIGHT / 2
const STAPE_GAP = 12

export const margin = { "top": 50, "right": 50, "bottom": 50, "left": 50 }

const yMap = new Map<string, number>()
const parentByChild = new Map<string, string>()

export const getHeight = () => margin.top + margin.bottom + SEMI_LINE_HEIGHT + Array.from(yMap.values()).reduce((acc, y) => Math.max(acc, y), 0)

export const isPhilosophical = (event: HistoricalEvent) => {
    const { type } = event
    return type === 'philosophy' || type === 'interpretation'
}

export const getPhilosophicalEvents = (events: HistoricalEvents) => events.filter(isPhilosophical)

export const getPhisicalEvents = (events: HistoricalEvents) => events.filter(event => !isPhilosophical(event))

export const fillY = (data: HistoricalStages) => {
    const { stages } = data
    let y = margin.top
    stages.forEach((stage, i) => {
        const { name, events } = stage
        const stageName = name
        y += SEMI_HEADER_HEIGHT
        yMap.set(name, y)
        y += SEMI_HEADER_HEIGHT

        const philosArr = getPhilosophicalEvents(events)
        const phisicArr = getPhisicalEvents(events)
        const bigArr    = philosArr.length >  phisicArr.length ? philosArr : phisicArr
        const smallArr  = philosArr.length <= phisicArr.length ? philosArr : phisicArr

        smallArr.forEach(({name}) => parentByChild.set(name, stageName))

        bigArr.forEach(({name}) => {
            y += SEMI_LINE_HEIGHT
            yMap.set(name, y)
            y += SEMI_LINE_HEIGHT
        })

        let ySmall = 0

        smallArr.forEach(({ name }) => {
            if(!ySmall) {
                const parent = parentByChild.get(name)
                if(!parent) throw 'no parent'
                ySmall = getY(parent) + SEMI_HEADER_HEIGHT
            }
            ySmall += SEMI_LINE_HEIGHT
            yMap.set(name, ySmall)
            ySmall += SEMI_LINE_HEIGHT
        })
        y += STAPE_GAP
    })
}

export const getY = (name: string): number => {
    const y = yMap.get(name)
    if(!y) throw `no y for ${name}`
    return y
}
