import { TYPE } from "./nodeFactory.js"
import { buildEdgeId, download, runSparqlSelectQueryOnRdfString } from "../utils.js"
import { DataFactory, slugify, Writer } from "../assets/bundle.js"

export class Graph {
    constructor(editor) {
        this.editor = editor
        this.nodesMap = {}
        this.edgesMap = {}
        this.stepCounter = 0
    }

    getNodeByEditorId(editorId) {
        return Object.values(this.nodesMap).find(node => node.editorId.toString() === editorId.toString())
    }

    removeEdge(connection) {
        let edgeId = buildEdgeId(connection)
        delete this.edgesMap[edgeId]
        console.log("Edge removed", edgeId)
    }

    removeNode(editorId) {
        let nodeId = this.getNodeByEditorId(editorId).id
        delete this.nodesMap[nodeId]
        console.log("Node removed", nodeId)
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
        Object.values(this.nodesMap).forEach(node => writer.addQuad(graph, hasNode, this.ff(node.exportId)))
        Object.values(this.edgesMap).forEach(edge => writer.addQuad(graph, hasEdge, this.ff(edge.exportId)))

        // nodes
        Object.values(this.nodesMap).forEach(node => {
            let n = this.ff(node.exportId)
            writer.addQuad(n, a, nodeRdfClass)
            writer.addQuad(n, hasClass, this.ff(node.constructor.name))
            writer.addQuad(n, hasName, DataFactory.literal(node.name))
            writer.addQuad(n, hasPosX, DataFactory.literal(node.x))
            writer.addQuad(n, hasPosY, DataFactory.literal(node.y))
            if (!node.isProcessor) {
                writer.addQuad(n, hasValue, DataFactory.literal(node.getValue().trim()))
            }
        })
        // edges
        Object.values(this.edgesMap).forEach(edge => {
            let e = this.ff(edge.exportId)
            writer.addQuad(e, a, edgeRdfClass)
            writer.addQuad(e, hasSource, this.ff(edge.sourceNode.exportId))
            writer.addQuad(e, hasTarget, this.ff(edge.targetNode.exportId))
            writer.addQuad(e, hasPortOut, DataFactory.literal(Number(edge.portOut.split("_")[1]) - 1))
            writer.addQuad(e, hasPortIn, DataFactory.literal(Number(edge.portIn.split("_")[1]) - 1))
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
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT * WHERE {
                ?node a ff:Node ;
                    ff:hasName ?name ;
                    ff:hasClass ?class ;
                    ff:hasPosX ?x ;
                    ff:hasPosY ?y .
                OPTIONAL { 
                    ?node ff:hasValue ?value .
                }
            }`
        let bindings = await runSparqlSelectQueryOnRdfString(query, rdfStr)
        console.log(bindings)

        // TODO
    }
}
