import { ensureUniqueId } from "../utils.js"

export class Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        this.name = name
        this.inputs = inputs
        this.incomingData = []
        this.outputs = outputs
        this.x = x
        this.y = y
        this.editor = editor
        this.nodesMap = nodesMap
        this.type = type
        this.html = ''
        this.ranThisRound = false
    }

    run(outgoingEdges, value) {
        this.highlight(true)
        let outputPortType = this.outputs[0] // assuming only one type of output port per node for now
        for (let edge of outgoingEdges) {
            edge.highlight(true)
            let targetNode = this.nodesMap[edge.targetNodeId]
            targetNode.incomingData.push({
                from: this.id,
                dataType: outputPortType,
                data: value
            })
        }
        this.ranThisRound = true
    }

    highlight(bool) {
        let el = document.getElementById("node-" + this.editorId)
        if (bool) {
            el.classList.add("highlighted-node")
        } else {
            el.classList.remove("highlighted-node")
        }
    }

    isReadyToRun() {
        return !this.ranThisRound && (this.inputs.length === 0 || this.allIncomingDataAvailable())
    }

    allIncomingDataAvailable() {
        return this.incomingData.length === this.inputs.length
    }

    addNode() {
        this.editorId = this.editor.addNode(this.name, this.inputs.length, this.outputs.length, this.x, this.y, "", {}, this.html)
        this.editorNodeObj = this.editor.getNodeFromId(this.editorId)
        this.id = ensureUniqueId(this.name, this.nodesMap)
        this.nodesMap[this.id] = this
        console.log("Node added:", this.id, "\"" + this.name + "\"", "at", this.x, "/", this.y, this)
    }
}
