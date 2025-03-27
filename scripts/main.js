const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");

const margin = { top: 20, right: 20, bottom: 30, left: 50 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .translateExtent([[-100, -100], [width + 100, height + 100]])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

svg.call(zoom)
    .call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top).scale(1));

function drawChart() {
    g.selectAll("*").remove(); // Limpa o gráfico antes de redesenhar

    d3.json("scripts/data/dataset.json").then(data => {
        // Inclui todas as fases no eixo X, mesmo as que estão aguardando
        const x = d3.scalePoint()
            .domain(data.map(d => d.phase)) // Inclui todas as fases
            .range([0, innerWidth])
            .padding(0.5);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.scopeChanges, d.stressLevel))])
            .range([innerHeight, 0]);

        const xAxis = d3.axisBottom(x);
        const yAxis = d3.axisLeft(y);

        g.append("g")
            .call(yAxis)
            .attr("class", "y-axis");

        g.append("g")
            .call(xAxis)
            .attr("transform", `translate(0,${innerHeight})`)
            .attr("class", "x-axis");

        // Filtrar dados para desenhar apenas os pontos conectados
        const filteredData = data.filter(d => d.phase !== "Sprint Review 4" && d.phase !== "Sprint Review 5");

        // Adicionar linha conectando os pontos com animação
        const line = d3.line()
            .x(d => x(d.phase))
            .y(d => y(d.stressLevel))
            .curve(d3.curveMonotoneX); // Curva suave

        const path = g.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Animação da linha
        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", `${totalLength} ${totalLength}`) // Define o comprimento total da linha
            .attr("stroke-dashoffset", totalLength) // Esconde a linha inicialmente
            .transition()
            .duration(2000) // Duração da animação (2 segundos)
            .ease(d3.easeLinear) // Suavidade da animação
            .attr("stroke-dashoffset", 0); // Revela a linha gradualmente

        // Adicionar bolinhas apenas para os pontos conectados
        const circles = g.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.phase))
            .attr("cy", d => y(d.stressLevel))
            .attr("r", 8)
            .attr("fill", d => {
                if (d.stressLevel === 0 && d.scopeChanges === 0) return "green"; // Onboarding
                if (d.stressLevel <= 3 && d.scopeChanges <= 2) return "blue"; // Kick-off
                if (d.stressLevel >= 6 && d.scopeChanges >= 5) return "red"; // Sprint Review 1
                if (d.stressLevel > 6) return "orange"; // Sprint Review 2
                if (d.stressLevel <= 5 && d.scopeChanges <= 3) return "purple"; // Sprint Review 3
                return "gray";
            });

        circles.transition()
            .duration(1000)
            .attr("r", 10)
            .transition()
            .duration(1000)
            .attr("r", 8);

        // Adicionar pontos vazios para as sprints aguardando
        const emptyCircles = g.selectAll(".empty-circle")
            .data(data.filter(d => d.phase === "Sprint Review 4" || d.phase === "Sprint Review 5"))
            .enter()
            .append("circle")
            .attr("cx", d => x(d.phase))
            .attr("cy", innerHeight) // Posiciona no eixo X
            .attr("r", 8)
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "2,2"); // Estilo tracejado para indicar vazio
    });
}

// Desenhar o gráfico inicialmente
drawChart();

// Adicionar evento ao botão para reiniciar a animação
d3.select("#restart-animation").on("click", () => {
    drawChart();
});