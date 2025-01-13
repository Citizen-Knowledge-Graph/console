import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { randStr, runSparqlSelectQueryOnRdfString, shrink } from "../../../utils.js"
import { slugify } from "../../../assets/bundle.js"

export class GraphVisuNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.ANY ], [], TYPE.VIEW)
        this.NODE_TYPE = {
            URI: "",
            LITERAL: "green",
            BLANK: "gray",
            VARIABLE: "orange"
        }
    }

    getMainHtml() {
        return `<div class="graph-visu-container"></div>`
    }

    async processTurtleData(turtle) {
        let query = `SELECT * WHERE { ?s ?p ?o . }`
        let triples = await runSparqlSelectQueryOnRdfString(query, turtle)

        let nodes = {}
        let edges = []

        for (let triple of triples) {
            let sub = triple.s
            if (!nodes[sub]) nodes[sub] = { id: sub, label: shrink(sub), type: this.NODE_TYPE.URI }
            let pred = triple.p
            let obj = triple.o
            if (obj.startsWith("http") || obj.startsWith("bc_")) {
                if (!nodes[obj]) nodes[obj] = { id: obj, label: shrink(obj), type: obj.startsWith("http") ? this.NODE_TYPE.URI : this.NODE_TYPE.BLANK }
            } else {
                let id = `${randStr()}_${slugify(obj, { lower: true })}`
                nodes[id] = { id, label: obj, type: this.NODE_TYPE.LITERAL }
                obj = id
            }
            edges.push({ source: sub, target: obj, label: shrink(pred) })
        }
        return { nodes: Object.values(nodes), links: edges }
    }

    async processSparqlData(sparql) {

    }

    async processIncomingData() {
        let container = this.nodeDiv.querySelector(".graph-visu-container")
        let graphData = {}
        switch (this.incomingData[0].dataType) {
            case PORT.TURTLE:
                graphData = await this.processTurtleData(this.incomingData[0].data)
                break
            case PORT.SPARQL:
                graphData = await this.processSparqlData(this.incomingData[0].data)
                break
        }
        ForceGraph()(container)
            .width(400)
            .height(300)
            .nodeLabel("label")
            .linkLabel("label")
            .nodeColor(node => node.type)
            .graphData(graphData)

        this.rerenderConnectingEdges()
        return ""
    }

    getValue() { return "" }
    setValue(value) {}
}
