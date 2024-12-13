import { PORT, TYPE } from "./nodeFactory.js"
import { buildEdgeId, download, serializeStoreToTurtle } from "../utils.js"
import { Store, DataFactory, slugify } from "../assets/bundle.js"

export class Graph {
    constructor() {
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
        let store = new Store()
        const graph = this.ff("graph")
        const a = DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
        // nodes
        const nodeRdfClass = this.ff("Node")
        const hasNode = this.ff("hasNode")
        const hasClass = this.ff("hasClass") // e.g. TurtleInputNode
        const hasType = this.ff("hasType") // INPUT or PROCESSOR
        const hasName = this.ff("hasName")
        const hasPosX = this.ff("hasPosX")
        const hasPosY = this.ff("hasPosY")
        const hasInputType = this.ff("hasInputType")
        const hasOutputType = this.ff("hasOutputType")
        const hasValue = this.ff("hasValue")
        // edges
        const edgeRdfClass = this.ff("Edge")
        const hasEdge = this.ff("hasEdge")
        const hasSource = this.ff("hasSource")
        const hasTarget = this.ff("hasTarget")
        const hasPortOut = this.ff("hasPortOut")
        const hasPortIn = this.ff("hasPortIn")
        // both
        // const hasId = this.ff("hasId")

        store.addQuad(graph, a, this.ff("Graph"))
        if (exportName) store.addQuad(graph, hasName, DataFactory.literal(exportName))
        store.addQuad(graph, this.ff("hasExportTimestamp"), DataFactory.literal(new Date().toISOString()))

        // nodes
        Object.values(this.nodesMap).forEach(node => {
            let n = this.ff(node.exportId)
            store.addQuad(graph, hasNode, n)
            store.addQuad(n, a, nodeRdfClass)
            // store.addQuad(n, hasId, DataFactory.literal(node.id))
            store.addQuad(n, hasClass, this.ff(node.constructor.name))
            store.addQuad(n, hasType, this.ff(Object.keys(TYPE)[node.type]))
            store.addQuad(n, hasName, DataFactory.literal(node.name))
            store.addQuad(n, hasPosX, DataFactory.literal(node.x))
            store.addQuad(n, hasPosY, DataFactory.literal(node.y))
            node.inputs.forEach(input => {
                store.addQuad(n, hasInputType, this.ff(Object.keys(PORT)[input]))
            })
            node.outputs.forEach(output => {
                store.addQuad(n, hasOutputType, this.ff(Object.keys(PORT)[output]))
            })
            if (!node.isProcessor) {
                store.addQuad(n, hasValue, DataFactory.literal(node.getValue().trim()))
            }
        })
        // edges
        Object.values(this.edgesMap).forEach(edge => {
            let e = this.ff(edge.exportId)
            store.addQuad(graph, hasEdge, e)
            store.addQuad(e, a, edgeRdfClass)
            // store.addQuad(e, hasId, DataFactory.literal(edge.id))
            store.addQuad(e, hasSource, this.ff(edge.sourceNode.exportId))
            store.addQuad(e, hasTarget, this.ff(edge.targetNode.exportId))
            store.addQuad(e, hasPortOut, DataFactory.literal(Number(edge.portOut.split("_")[1]) - 1))
            store.addQuad(e, hasPortIn, DataFactory.literal(Number(edge.portIn.split("_")[1]) - 1))
        })

        let turtle = await serializeStoreToTurtle(store)
        console.log(turtle)
        const date = new Date().toISOString().split("T")[0]
        let namePart = exportName ? `${slugify(exportName, { lower: true })}_` : ""
        download(turtle, "text/turtle", `semOps_export_${namePart}${date}.ttl`)
    }
}
