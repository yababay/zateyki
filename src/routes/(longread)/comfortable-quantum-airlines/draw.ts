import * as d3 from 'd3'
import { fillY, getY, margin, getHeight, isPhilosophical } from './util'
import type { HistoricalStages } from './types'
import raw from './quantum-history.json?raw'

export default (div: HTMLDivElement) => {

    const data = JSON.parse(raw) as HistoricalStages
    const { stages } = data

    fillY(data)

    const width = div.clientWidth
    const height = getHeight()

    const svg = d3.select(div)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const r = 5
    const dx = 10 // gap
    const dy = r // gap
    const xPhisicalC = margin.left
    const xPhilosophicalC = width - margin.left - 150
    const links = new Array<string[]>() 
    
    stages.forEach(({name, events}) => {
        const y = getY(name)
        const yl = y + 3
        svg.append("text")
            .attr("y", y)
            .attr("x", xPhisicalC)
            .attr("width", 300)
            .attr("text-anchor", "left")
            .text(name)
            .style("font-size", "12px")
            .style("font-weight", 'bold')
        svg.append('line')
            .attr('x1', margin.left)
            .attr('y1', yl)
            .attr('x2', width - margin.right)
            .attr('y2', yl)
            .attr('stroke', 'silver')
        events.forEach(event => {
            const { name, year, note, link } = event
            const isPhil = isPhilosophical(event)
            const y = getY(name)
            if(link) links.push([name, link])

            const g = svg.append("g")
                .attr("transform", d => `translate(${isPhil ? xPhilosophicalC : xPhisicalC},${y})`)

            g.append("circle")
                .attr("r", r)
                .classed(isPhil ? "philosophical" : "phisical", true)
                .append("title").text(note || '')

            g.append("text")
                //.attr("y", getY(name))
                //.attr("x", isPhil ? xPhilosophicalT : xPhisicalT)
                .attr("dx", dx)
                .attr("dy", dy)
                .attr("width", 300)
                .attr("text-anchor", "left")
                .text(`${name} (${year})`)
                .style("font-size", "12px")
                .classed(isPhil ? "philosophical" : "phisical", true)
                //.append("title").text(note || '')
        })
        links.forEach(([from, to]) => {
            const x = xPhilosophicalC - 8
            const x1 = x
            const y1 = getY(from)// - 3
            const x2 = x
            const y2 = getY(to)// - 3
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dr = (width / 2) - Math.sqrt(dx * dx + dy * dy);
            svg.append("path")
                .attr("d", `M${x2},${y2} A${dr},${dr} 0 0,1 ${x1},${y1}`)
                .attr("fill", "none")
                .attr("stroke", "orange")
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "4,4") // Делаем линию пунктирной
                .attr("opacity", 0.6)
                .style("pointer-events", "none"); // Чтобы не мешала кликам по узлам
        })
    })
}
