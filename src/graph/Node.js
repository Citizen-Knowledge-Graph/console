import { ensureUniqueId } from "../utils.js"
import { TYPE } from "./nodeFactory.js"

export class Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        this.name = name
        this.inputs = inputs
        this.incomingData = []
        this.outputs = outputs
        this.x = Number(x)
        this.y = Number(y)
        this.editor = editor
        this.nodesMap = nodesMap
        this.type = type
        this.ranThisRound = false
        this.editorId = editor.addNode(name, inputs.length, outputs.length, x, y, "", {}, this.getHtml())
        this.id = ensureUniqueId(this.name, this.nodesMap)
        this.nodesMap[this.id] = this
        console.log("Node added:", this.id, "\"" + this.name + "\"", "at", this.x, "/", this.y, this)
    }

    updatePos(x, y) {
        this.x = x
        this.y = y
    }

    isProcessor() {
        return this.type === TYPE.PROCESSOR
    }

    getHtml() {
        return ""
    }

    run(outgoingEdges, value) {
        this.highlight(true)
        this.highlightPort("output_1")
        let outputPortType = this.outputs[0] // assuming only one type of output port per node for now
        for (let edge of outgoingEdges) {
            edge.highlight(true)
            let targetNode = this.nodesMap[edge.targetNode.id]
            targetNode.highlightPort(edge.portIn)
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

    highlightPort(portClass) {
        let nodeEl = document.getElementById("node-" + this.editorId)
        let inputDivs = nodeEl.querySelector(portClass.includes("input") ? ".inputs" : ".outputs").querySelectorAll("div")
        for (let div of inputDivs) {
            if (div.classList.contains(portClass)) {
                div.classList.add("highlighted-port")
            }
        }
    }

    unhighlightAllPorts() {
        let nodeEl = document.getElementById("node-" + this.editorId)
        let divs = nodeEl.querySelectorAll(".inputs div, .outputs div")
        for (let div of divs) {
            div.classList.remove("highlighted-port")
        }
    }

    isReadyToRun() {
        return !this.ranThisRound && (this.inputs.length === 0 || this.allIncomingDataAvailable())
    }

    allIncomingDataAvailable() {
        return this.incomingData.length === this.inputs.length
    }
}
