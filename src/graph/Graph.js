import { createNode, TYPE } from "./nodeFactory.js"
import { buildEdgeId, download, runSparqlSelectQueryOnRdfString } from "../utils.js"
import { DataFactory, slugify, Writer } from "../assets/bundle.js"

export class Graph {
    constructor(editor) {
        this.editor = editor
        this.nodesMap = {}
        this.edgesMap = {}
        this.stepCounter = 0
    }

    clear() {
        this.nodesMap = {}
        this.edgesMap = {}
        this.stepCounter = 0
    }

    removeEdge(connection) {
        let edgeId = buildEdgeId(connection)
        delete this.edgesMap[edgeId]
        console.log("Edge removed", edgeId)
    }

    removeNode(id) {
        delete this.nodesMap[id]
        console.log("Node removed", id)
        // removal of attached edge gets handled by the editor and triggers removeEdge() for each
    }

    async run() {
        while (await this.step()) {}
    }

    async step() {
        Object.values(this.nodesMap).forEach(node => node.highlight(false))
        Object.values(this.edgesMap).forEach(edge => edge.highlight(false))
        // nodes that have not run this round yet and have either no input ports (Type.INPUT) or have all incoming data available (Type.PROCESSOR)
        let readyNodes = Object.values(this.nodesMap).filter(node => node.isReadyToRun())
        if (readyNodes.length === 0) {
            console.log("No more nodes are ready to run, resetting run-flags and data in ports")
            this.endRound()
            return false
        }
        for (let node of readyNodes) {
            let outgoingEdges = Object.values(this.edgesMap).filter(edge => edge.sourceNode.id === node.id)
            await node.run(outgoingEdges)
        }
        console.log("nodesMap after step", this.stepCounter ++, this.nodesMap)
        return true
    }

    endRound() {
        for (let node of Object.values(this.nodesMap)) {
            node.ranThisRound = false
            node.incomingData = []
            node.unhighlightAllPorts()
        }
        this.stepCounter = 0
    }

    reset() {
        this.endRound()
        Object.values(this.nodesMap).forEach(node => node.highlight(false))
        Object.values(this.edgesMap).forEach(edge => edge.highlight(false))
        Object.values(this.nodesMap).filter(node => node.type === TYPE.PROCESSOR).forEach(node => node.clear())
    }

    ff(localName) {
        return DataFactory.namedNode("https://foerderfunke.org/default#" + localName)
    }

    localName(uri) {
        return uri.split("#")[1]
    }

    async export(exportName) {
        let writer = new Writer({
            prefixes: {
                rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                ff: "https://foerderfunke.org/default#"
            }
        })
        const graph = this.ff("graph")
        const a = DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
        // nodes
        const nodeRdfClass = this.ff("Node")
        const hasNode = this.ff("hasNode")
        const hasClass = this.ff("hasClass") // e.g. TurtleInputNode
        const hasName = this.ff("hasName")
        const hasPosX = this.ff("hasPosX")
        const hasPosY = this.ff("hasPosY")
        const hasValue = this.ff("hasValue")
        const hasAdditionalNumbOfInputs = this.ff("hasAdditionalNumbOfInputs")
        // edges
        const edgeRdfClass = this.ff("Edge")
        const hasEdge = this.ff("hasEdge")
        const hasSource = this.ff("hasSource")
        const hasTarget = this.ff("hasTarget")
        const hasPortOut = this.ff("hasPortOut")
        const hasPortIn = this.ff("hasPortIn")

        writer.addQuad(graph, a, this.ff("Graph"))
        if (exportName) writer.addQuad(graph, hasName, DataFactory.literal(exportName))
        writer.addQuad(graph, this.ff("hasExportTimestamp"), DataFactory.literal(new Date().toISOString()))

        // pre-run to have triples with graph as subjects nicely first -store would have sorted this automatically, but writer is a stream-writer
        // and to create id-mapping
        let nodeIdMap = {}
        let nodeCounter = 1
        let edgeIdMap = {}
        let edgeCounter = 1
        Object.values(this.nodesMap).forEach(node => {
            let exportId = this.ff("node" + nodeCounter ++)
            writer.addQuad(graph, hasNode, exportId)
            nodeIdMap[node.id] = exportId
        })
        Object.values(this.edgesMap).forEach(edge => {
            let exportId = this.ff("edge" + edgeCounter ++)
            writer.addQuad(graph, hasEdge, exportId)
            edgeIdMap[edge.id] = exportId
        })

        // nodes
        Object.values(this.nodesMap).forEach(node => {
            let n = nodeIdMap[node.id]
            writer.addQuad(n, a, nodeRdfClass)
            writer.addQuad(n, hasClass, this.ff(node.constructor.name))
            writer.addQuad(n, hasName, DataFactory.literal(node.name))
            if (node.inputs.length !== node.numbInitialInputs) {
                writer.addQuad(n, hasAdditionalNumbOfInputs, DataFactory.literal(node.inputs.length - node.numbInitialInputs))
            }
            let editorNode = this.editor.getNodeFromId(node.id)
            writer.addQuad(n, hasPosX, DataFactory.literal(editorNode.pos_x))
            writer.addQuad(n, hasPosY, DataFactory.literal(editorNode.pos_y))
            if (!node.isProcessor()) {
                writer.addQuad(n, hasValue, DataFactory.literal(node.getValue().trim()))
            }
        })
        // edges
        Object.values(this.edgesMap).forEach(edge => {
            let e = edgeIdMap[edge.id]
            writer.addQuad(e, a, edgeRdfClass)
            writer.addQuad(e, hasSource, nodeIdMap[edge.sourceNode.id])
            writer.addQuad(e, hasTarget, nodeIdMap[edge.targetNode.id])
            writer.addQuad(e, hasPortOut, DataFactory.literal(Number(edge.portOut.split("_")[1])))
            writer.addQuad(e, hasPortIn, DataFactory.literal(Number(edge.portIn.split("_")[1])))
        })

        writer.end((err, turtle) => {
            if (err) {
                console.error(err)
                return
            }
            console.log(turtle)
            const date = new Date().toISOString().split("T")[0]
            let namePart = exportName ? `${slugify(exportName, { lower: true })}_` : ""
            download(turtle, "text/turtle", `semOps_export_${namePart}${date}.ttl`)
        })
    }

    async import(rdfStr) {
        // nodes
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT * WHERE {
                ?node a ff:Node ;
                    ff:hasName ?name ;
                    ff:hasClass ?class ;
                    ff:hasPosX ?x ;
                    ff:hasPosY ?y .
                OPTIONAL { ?node ff:hasValue ?value . }
                OPTIONAL { ?node ff:hasAdditionalNumbOfInputs ?hasAdditionalNumbOfInputs . }                
            }`
        let rows = await runSparqlSelectQueryOnRdfString(query, rdfStr)
        let idMap = {} // identifier in imported turtle to new node.id based on name
        for (let row of rows) {
            let node = createNode(this.localName(row.class), row.name, row.x, row.y, this.editor, this.nodesMap)
            if (row.value) node.setValue(row.value)
            if (row.hasAdditionalNumbOfInputs) node.addAdditionalNumbOfInputs(row.hasAdditionalNumbOfInputs)
            idMap[row.node] = node.id
        }
        // edges
        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT * WHERE {
                ?edge a ff:Edge ;
                    ff:hasSource ?source ;
                    ff:hasTarget ?target ;
                    ff:hasPortOut ?portOut ;
                    ff:hasPortIn ?portIn .
            }`
        rows = await runSparqlSelectQueryOnRdfString(query, rdfStr)
        for (let row of rows) {
            let sourceNode = this.nodesMap[idMap[row.source]]
            let targetNode = this.nodesMap[idMap[row.target]]
            this.editor.addConnection(sourceNode.id, targetNode.id, "output_" + row.portOut, "input_" + row.portIn)
        }
    }
}
