setInterval(checkForNewRepoCommits, 60 * 1000)

async function func() {
    let query = "SELECT * WHERE { ?s ?p ?o }"
    let rdfStr = `
        @prefix ex: <http://example.org/> .
        ex:sub ex:pred ex:obj .
    `
    let result = await runSparqlSelectQueryOnRdfString(query, rdfStr)
    console.log(result)
}

async function dev() {
    let rpsDir = await fetchAsset("rps-dir.txt")
    console.log(rpsDir)
}

/*document.getElementById("fileUpload").addEventListener("change", function() {
    const reader = new FileReader()
    reader.onload = function(event) {
        const content = event.target.result
        console.log("File content:", content)
    }
    const file = this.files[0]
    reader.readAsText(file)
})*/

function initLitegraph() {
    let graph = new LGraph()
    let canvasEl = new LGraphCanvas("#canvas", graph)

    let node1 = LiteGraph.createNode("basic/string")
    node1.pos = [200, 200]
    graph.add(node1)
    node1.setValue("foo")

    let node2 = LiteGraph.createNode("basic/watch")
    node2.pos = [700, 200]
    graph.add(node2)

    node1.connect(0, node2, 0 )

    graph.start()
}
