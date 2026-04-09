export type HistoricalEventType = 'interpretation' | 'philosophy'

export type HistoricalEvent = {
    name: string
    year: number
    type?: HistoricalEventType
    note?: string
    link?: string
}

export type HistoricalEvents = HistoricalEvent[]

export type HistoricalStage = {
    name: string
    events: HistoricalEvent[]
}

export type HistoricalStages = {
    stages: HistoricalStage[]
}
