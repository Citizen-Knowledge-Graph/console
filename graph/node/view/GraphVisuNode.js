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
            BLANK: "silver",
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
            const processTerm = (value, type) => {
                switch (type) {
                    case this.NODE_TYPE.URI:
                        return { id: value, label: shrink(value), type: type }
                    case this.NODE_TYPE.LITERAL:
                        let id = `${randStr()}_${slugify(value, { lower: true })}`
                        return { id, label: `"${value}"`, type: type }
                    case this.NODE_TYPE.BLANK:
                        return { id: value, label: "[ ]", type: type }
                }
            }
            let sub = processTerm(triple.s, triple.s.startsWith("http") ? this.NODE_TYPE.URI : this.NODE_TYPE.BLANK)
            let pred = triple.p
            let objType = this.NODE_TYPE.LITERAL
            if (triple.o.startsWith("http")) objType = this.NODE_TYPE.URI
            if (triple.o.startsWith("bc_")) objType = this.NODE_TYPE.BLANK
            let obj = processTerm(triple.o, objType)
            nodes[sub.id] = sub
            nodes[obj.id] = obj
            edges.push({ source: sub.id, target: obj.id, label: shrink(pred) })
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
                        return { id, label: `"${term.value}"`, type: this.NODE_TYPE.LITERAL }
                    case "BlankNode":
                        return { id: term.value, label: "[ ]", type: this.NODE_TYPE.BLANK }
                    case "Variable":
                        return { id: term.value, label: "?" + term.value, type: this.NODE_TYPE.VARIABLE }
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

        let width = 450
        let height = 450
        this.widthMinus = 25
        this.heightMinus = 70
        this.nodeDiv.style.setProperty("width", width + "px", "important")
        this.nodeDiv.style.setProperty("height", height + "px", "important")

        this.forceGraph = ForceGraph()(container)
            .width(width - this.widthMinus)
            .height(height - this.heightMinus)
            .nodeLabel("label")
            .linkLabel("label")
            .linkDirectionalArrowLength(6)
            .linkDirectionalArrowRelPos(1)
            .nodeColor(node => node.type)
            .graphData(graphData)
            // .backgroundColor("#f9f9f9")

        this.rerenderConnectingEdges()
        return ""
    }

    postResize(dy, width, height) {
        this.forceGraph.width(width - this.widthMinus).height(height - this.heightMinus)
    }

    getValue() { return "" }
    setValue(value) {}
}
