import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { runSparqlSelectQueryOnRdfString, shrink } from "../../../utils.js"
import { slugify } from "../../../assets/bundle.js"

export class GraphVisuNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [], TYPE.VIEW)
    }

    getMainHtml() {
        return `<div class="graph-visu-container"></div>`
    }

    async processIncomingData() {
        let container = this.nodeDiv.querySelector(".graph-visu-container")
        let turtle = this.incomingData[0].data
        let query = `SELECT * WHERE { ?s ?p ?o . }`
        let triples = await runSparqlSelectQueryOnRdfString(query, turtle)

        const randStr = () => Math.random().toString(36).substring(2, 6)
        let nodes = {}
        let edges = []

        for (let triple of triples) {
            let sub = triple.s
            if (!nodes[sub]) nodes[sub] = { id: sub, label: shrink(sub), isLiteral: false }
            let pred = triple.p
            let obj = triple.o
            if (obj.startsWith("http") || obj.startsWith("bc_")) {
                if (!nodes[obj]) nodes[obj] = { id: obj, label: shrink(obj), isLiteral: false }
            } else {
                let id = `${randStr()}_${slugify(obj, { lower: true })}`
                nodes[id] = { id, label: obj, isLiteral: true }
                obj = id
            }
            edges.push({ source: sub, target: obj, label: shrink(pred) })
        }

        ForceGraph()(container)
            .width(400)
            .height(300)
            .nodeLabel("label")
            .linkLabel("label")
            .nodeColor(node => node.isLiteral ? "green" : "")
            .graphData({ nodes: Object.values(nodes), links: edges })

        this.rerenderConnectingEdges()
        return ""
    }

    getValue() { return "" }
    setValue(value) {}
}
