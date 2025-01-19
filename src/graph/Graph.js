import { factoryCreateNode, TYPE } from "./nodeFactory.js"
import { buildEdgeId, downloadGraph, getTimestamp, runSparqlSelectQueryOnRdfString } from "../utils.js"
import { DataFactory, Writer } from "../assets/bundle.js"
import { Edge } from "./Edge.js"

export class Graph {
    constructor(editor, showMessage) {
        this.showMessage = showMessage
        this.editor = editor
        this.nodesInErrorState = []
        this.clear()
        this.settings = {
            defaultWidth: { label: "Default Node Width", variable: "--default-node-width", value: "414px", defaultValue: "414px" },
            codeFontSize: { label: "Code Font Size", variable: "--code-font-size", value: "12px", defaultValue: "12px" },
        }
        Object.keys(this.settings).forEach(key => {
            let value = localStorage.getItem(key)
            if (value) this.settings[key].value = value
        })
        this.applySettings()
    }

    applySettings() {
        for (let setting of Object.values(this.settings)) {
            document.documentElement.style.setProperty(setting.variable, setting.value)
        }
        Object.values(this.nodesMap).forEach(node => node.refreshAfterAppliedSettings())
    }

    updateSettings(newValues) {
        for (let [key, value] of Object.entries(newValues)) {
            localStorage.setItem(key, value)
            this.settings[key].value = value
        }
        this.applySettings()
    }

    resetSettings() {
        for (let setting of Object.values(this.settings)) setting.value = setting.defaultValue
        Object.keys(this.settings).forEach(key => localStorage.removeItem(key))
        this.applySettings()
    }

    clear() {
        this.nodesMap = {}
        this.edgesMap = {}
        this.stepCounter = 0
        this.id = "graph_" + getTimestamp()
        this.setName("")
    }

    setName(name) {
        this.name = name
        this.updateGraphTitle()
    }

    updateGraphTitle() {
        let el = document.getElementById("graphTitle")
        if (this.name) {
            el.textContent = this.name
            el.title = "the name of your graph - click to rename"
        } else {
            el.textContent = this.id
            el.title = "the automatic ID of your graph - click to give it a name"
        }
    }

    createNode(nodeClass, initialValues) {
        return factoryCreateNode(nodeClass, initialValues, this)
    }

    onEditorEdgeCreated(connectionObj) {
        // this gets called after the editor already created a node, so we can wrap our own Edge object around it
        if (Edge.isInvalid(connectionObj, this)) return
        let edge = new Edge(connectionObj, this)
        if (edge.targetNode.constructor.name === "TurtleInputNodeWithCopyPasteInPort") {
            let value = edge.sourceNode.getValue()
            if (value) edge.targetNode.receiveCopyPasteValue(value)
        }
    }

    duplicateNode(node, includeIncomingEdges) {
        let editorNode = this.editor.getNodeFromId(node.id)
        let initialValues = {
            name: node.name,
            pos: [Number(editorNode.pos_x) + 30, Number(editorNode.pos_y) + 30]
        }
        if (node.isInput()) initialValues.value = node.getValue()
        let newNode = this.createNode(node.constructor.name, initialValues)
        if (!includeIncomingEdges) return
        for (let edge of Object.values(this.edgesMap).filter(edge => edge.targetNode === node)) {
            this.editor.addConnection(edge.sourceNode.id, newNode.id, edge.portOut, edge.portIn)
        }
        // duplicating outgoing would lead to multiple edges going into the same port, which is not something that makes sense to have... I think
    }

    wireIntoNewNode(nodes, nodeClass, label) {
        if (nodeClass !== "MergeTriplesNode" && nodes.length > 2) {
            this.showMessage(`Only the "Merge Triples" node accepts more than 2 inputs`, "red")
            return
        }
        let bb = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity } // bounding box
        for (let nodeDiv of nodes.map(node => node.nodeDiv)) {
            if (nodeDiv.offsetLeft < bb.minX) bb.minX = nodeDiv.offsetLeft
            if (nodeDiv.offsetTop < bb.minY) bb.minY = nodeDiv.offsetTop
            if (nodeDiv.offsetLeft + nodeDiv.offsetWidth > bb.maxX) bb.maxX = nodeDiv.offsetLeft + nodeDiv.offsetWidth
            if (nodeDiv.offsetTop + nodeDiv.offsetHeight > bb.maxY) bb.maxY = nodeDiv.offsetTop + nodeDiv.offsetHeight
        }
        let newNodePos = [bb.maxX + 150, bb.minY + (bb.maxY - bb.minY) / 2 - 100]
        let initialValues = { pos: newNodePos, name: label }
        let newNode = factoryCreateNode(nodeClass, initialValues, this)
        newNode.ensureNumberOfInputPorts(nodes.length)
        for (let i = 0; i < nodes.length; i++) {
            this.editor.addConnection(nodes[i].id, newNode.id, "output_1", "input_" + (i + 1))
        }
    }

    onEditorEdgeRemoved(connection) {
        let edgeId = buildEdgeId(connection)
        if (!this.edgesMap[edgeId]) return // edge was never really created --> attempt to double-book an input port
        delete this.edgesMap[edgeId]
        console.log("Edge removed", edgeId)
    }

    onEditorNodeRemoved(id) {
        delete this.nodesMap[id]
        console.log("Node removed", id)
        // removal of attached edge gets handled by the editor and triggers removeEdge() for each
    }

    async run() {
        for (let node of this.nodesInErrorState) node.resetError()
        this.nodesInErrorState = [] // actually support multiple ones simultaneously, not just one TODO
        while (this.nodesInErrorState.length === 0 && await this.step()) {}
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
        for (let node of readyNodes) await node.run()
        console.log("nodesMap after step", this.stepCounter ++, this.nodesMap)
        return true
    }

    endRound() {
        for (let node of Object.values(this.nodesMap)) {
            node.ranThisRound = false
            node.incomingData = []
            // if (node.constructor.name !== "OutputViewNodeWithInitialInput") { node.incomingData = [] }
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

    async save() {
        await this.toTurtle(turtle => {
            localStorage.setItem(this.id, turtle)
            this.showMessage("&#10003; Saved to local storage")
        })
    }

    handleNodeError(node) {
        this.showMessage(`Error in node "${node.name}"`, "red")
        this.nodesInErrorState.push(node)
        this.endRound()
    }

    async export() {
        await this.toTurtle(turtle => downloadGraph(this.name, turtle))
    }

    async toTurtle(callback, onlyTheseNodes = []) {
        // use rdf.io.dataset.toText() here too TODO
        let writer = new Writer({
            prefixes: {
                rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                ff: "https://foerderfunke.org/default#"
            }
        })
        // graph
        const graph = this.ff("graph")
        const a = DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
        const hasId = this.ff("hasId")
        const hasExportTimestamp = this.ff("hasExportTimestamp")
        const hasTranslateX = this.ff("hasTranslateX")
        const hasTranslateY = this.ff("hasTranslateY")
        // nodes
        const nodeRdfClass = this.ff("Node")
        const hasNode = this.ff("hasNode")
        const hasClass = this.ff("hasClass") // e.g. TurtleInputNode
        const hasName = this.ff("hasName")
        const hasPosX = this.ff("hasPosX")
        const hasPosY = this.ff("hasPosY")
        const hasWidth = this.ff("hasWidth")
        const hasHeight = this.ff("hasHeight")
        const hasValue = this.ff("hasValue")
        const hasContentHidden = this.ff("hasContentHidden")
        // edges
        const edgeRdfClass = this.ff("Edge")
        const hasEdge = this.ff("hasEdge")
        const hasSource = this.ff("hasSource")
        const hasTarget = this.ff("hasTarget")
        const hasPortOut = this.ff("hasPortOut")
        const hasPortIn = this.ff("hasPortIn")

        writer.addQuad(graph, a, this.ff("Graph"))
        writer.addQuad(graph, hasId, DataFactory.literal(this.id))
        if (this.name) writer.addQuad(graph, hasName, DataFactory.literal(this.name))
        writer.addQuad(graph, hasExportTimestamp, DataFactory.literal(new Date().toISOString()))
        let matrix = new DOMMatrix(document.querySelector("#drawflow .drawflow").style.transform)
        writer.addQuad(graph, hasTranslateX, DataFactory.literal(matrix.e))
        writer.addQuad(graph, hasTranslateY, DataFactory.literal(matrix.f))

        // pre-run to have triples with graph as subjects nicely first -store would have sorted this automatically, but writer is a stream-writer
        // and to create id-mapping
        let nodeIdMap = {}
        let nodeCounter = 1
        let edgeIdMap = {}
        let edgeCounter = 1
        let nodesToProcess = onlyTheseNodes.length > 0 ? onlyTheseNodes : Object.values(this.nodesMap)
        let edgesToProcess = onlyTheseNodes.length === 0 ? Object.values(this.edgesMap) : []

        nodesToProcess.forEach(node => {
            let exportId = this.ff("node" + nodeCounter ++)
            writer.addQuad(graph, hasNode, exportId)
            nodeIdMap[node.id] = exportId
        })
        Object.values(this.edgesMap).forEach(edge => {
            if (onlyTheseNodes.length > 0) {
                if (nodesToProcess.includes(edge.sourceNode) && nodesToProcess.includes(edge.targetNode)) edgesToProcess.push(edge)
                else return
            }
            let exportId = this.ff("edge" + edgeCounter ++)
            writer.addQuad(graph, hasEdge, exportId)
            edgeIdMap[edge.id] = exportId
        })

        // nodes
        nodesToProcess.forEach(node => {
            let n = nodeIdMap[node.id]
            writer.addQuad(n, a, nodeRdfClass)
            writer.addQuad(n, hasClass, this.ff(node.constructor.name))
            writer.addQuad(n, hasName, DataFactory.literal(node.name))
            let editorNode = this.editor.getNodeFromId(node.id)
            writer.addQuad(n, hasPosX, DataFactory.literal(editorNode.pos_x))
            writer.addQuad(n, hasPosY, DataFactory.literal(editorNode.pos_y))
            if (node.wasResized) {
                writer.addQuad(n, hasWidth, DataFactory.literal(node.getSize().width))
                writer.addQuad(n, hasHeight, DataFactory.literal(node.getSize().height))
            }
            if (node.contentIsHidden()) {
                writer.addQuad(n, hasContentHidden, DataFactory.literal(true))
            }
            if (node.isInput()) {
                writer.addQuad(n, hasValue, DataFactory.literal(node.getValueForExport().trim()))
            }
        })
        // edges
        edgesToProcess.forEach(edge => {
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
            callback(turtle)
        })
    }

    async import(rdfStr) {
        // graph
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT * WHERE {
                ?graph a ff:Graph ;
                    ff:hasId ?id .
                OPTIONAL { ?graph ff:hasName ?name . }
                OPTIONAL {
                    ?graph ff:hasTranslateX ?x ;
                        ff:hasTranslateY ?y .
                }
            }`
        let row = (await runSparqlSelectQueryOnRdfString(query, rdfStr))[0]
        if (row.id) this.id = row.id
        if (row.name) {
            this.name = row.name
            document.title = this.name
        }
        // if we need to preserve other elements of transform (e.g. scale, rotate), we should use DOMMatrix
        if (row.x) {
            document.querySelector("#drawflow .drawflow").style.transform = `translate(${row.x}px, ${row.y}px)`
            this.editor.canvas_x = Number(row.x)
            this.editor.canvas_y = Number(row.y)
        }
        this.updateGraphTitle()
        // nodes
        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT * WHERE {
                ?node a ff:Node ;
                    ff:hasName ?name ;
                    ff:hasClass ?class ;
                    ff:hasPosX ?x ;
                    ff:hasPosY ?y .
                OPTIONAL {
                    ?node ff:hasWidth ?width ;
                        ff:hasHeight ?height .
                }
                OPTIONAL { ?node ff:hasContentHidden ?contentHidden . }
                OPTIONAL { ?node ff:hasValue ?value . }
            }`
        let rows = await runSparqlSelectQueryOnRdfString(query, rdfStr)
        let idMap = {} // identifier in imported turtle (exportId) to the now actually instantiated node.id
        for (let row of rows) {
            let initialValues = {
                name: row.name,
                pos: [row.x, row.y]
            }
            if (row.value) initialValues.value = row.value
            if (row.width) initialValues.size = [row.width, row.height]
            if (row.contentHidden) initialValues.contentHidden = true
            let node = this.createNode(this.localName(row.class), initialValues)
            if (node.constructor.name === "MarkdownNode") node.switchToViewMode()
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
        let edges = []
        let highestPortInPerNode = {}
        for (let row of rows) {
            let targetNodeId = idMap[row.target]
            if (!highestPortInPerNode[targetNodeId] || highestPortInPerNode[targetNodeId] < row.portIn) {
                highestPortInPerNode[targetNodeId] = row.portIn
            }
            edges.push([idMap[row.source], targetNodeId, "output_" + row.portOut, "input_" + row.portIn])
        }
        for (let [nodeId, maxPortIn] of Object.entries(highestPortInPerNode)) {
            this.nodesMap[nodeId].ensureNumberOfInputPorts(maxPortIn)
        }
        for (let edge of edges) this.editor.addConnection(edge[0], edge[1], edge[2], edge[3])
    }
}
