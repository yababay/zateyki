import * as d3 from 'd3'

export default (div: HTMLDivElement) => {

    const svg = d3.select(div)
        .append("svg")
        .attr("width", 1000)
        .attr("height", 100)
        .append("text")
            .attr("y", 50)
            .attr("x", 100)
            .attr("width", 800)
            .attr("text-anchor", "left")
            .text('Hello, D3 widget!')
            .style("font-size", "36px")
            .style("font-weight", 'bold')
}
