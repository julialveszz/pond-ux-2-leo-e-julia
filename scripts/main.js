
const svgWidth = 800;
const svgHeight = 400;

const svg = d3.select("body")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", "translate(50,50)");

d3.json("scripts/data/dataset.json").then(data => {
    data.forEach(d => {
        d.scopeChanges = +d.scopeChanges;
        d.stressLevel = +d.stressLevel;
        d.date = new Date(d.date);
    });

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, svgWidth - 100]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.stressLevel)])
        .range([svgHeight - 100, 0]);

    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.stressLevel));

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .transition()
        .duration(2000)
        .attr("stroke-dasharray", function() {
            return this.getTotalLength();
        })
        .attr("stroke-dashoffset", function() {
            return this.getTotalLength();
        })
        .transition()
        .duration(2000)
        .attr("stroke-dashoffset", 0);

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.stressLevel))
        .attr("r", 5)
        .attr("fill", "orange")
        .on("mouseover", function(event, d) {
            d3.select(this).transition()
                .duration(200)
                .attr("r", 8);
            svg.append("text")
                .attr("x", xScale(d.date))
                .attr("y", yScale(d.stressLevel) - 10)
                .attr("class", "tooltip")
                .text(`Stress Level: ${d.stressLevel}`);
        })
        .on("mouseout", function(d) {
            d3.select(this).transition()
                .duration(200)
                .attr("r", 5);
            svg.selectAll(".tooltip").remove();
        });

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${svgHeight - 100})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", (event) => {
            svg.attr("transform", event.transform);
        });

    svg.call(zoom);
});