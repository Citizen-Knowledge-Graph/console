import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { randStr, runSparqlSelectQueryOnRdfString, shrink } from "../../../utils.js"
import { slugify } from "../../../assets/bundle.js"
import { SparqlParser } from "../../../assets/bundle.js"

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
        let ast = new SparqlParser().parse(sparql) // abstract syntax tree
        if (ast.queryType !== "SELECT") {
            this.handleError("Only SPARQL SELECT queries are supported for now")
            return { nodes: [], links: [] }
        }
        if (ast.where.length > 1) {
            this.handleError("Only basic graph patterns are supported for now, no FILTER etc.")
            return { nodes: [], links: [] }
        }
        let nodes = {}
        let edges = []
        for (let triple of ast.where[0].triples) {
            const processTerm = (term) => {
                switch (term.termType) {
                    case "NamedNode":
                        return { id: term.value, label: shrink(term.value), type: this.NODE_TYPE.URI }
                    case "Literal":
                        let id = `${randStr()}_${slugify(term.value, { lower: true })}`
                        return { id, label: term.value, type: this.NODE_TYPE.LITERAL }
                    case "BlankNode":
                        return { id: term.value, label: term.value, type: this.NODE_TYPE.BLANK }
                    case "Variable":
                        return { id: term.value, label: term.value, type: this.NODE_TYPE.VARIABLE }
                }
            }
            let sub = processTerm(triple.subject)
            let pred = processTerm(triple.predicate)
            let obj = processTerm(triple.object)
            nodes[sub.id] = sub
            nodes[obj.id] = obj
            edges.push({ source: sub.id, target: obj.id, label: pred.label })
        }
        return { nodes: Object.values(nodes), links: edges }
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
