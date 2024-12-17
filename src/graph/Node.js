import { TYPE } from "./nodeFactory.js"

export class Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        this.name = name
        this.inputs = inputs
        this.incomingData = []
        this.outputs = outputs
        this.editor = editor
        this.nodesMap = nodesMap
        this.type = type
        this.ranThisRound = false
        this.id = editor.addNode(name, inputs.length, outputs.length, x, y, "", {}, this.getHtml())
        this.nodesMap[this.id] = this
        console.log("Node added:", this.id, "\"" + this.name + "\"", "at", x, "/", y, this)
    }

    isProcessor() {
        return this.type === TYPE.PROCESSOR
    }

    getHtml() {
        return ""
    }

    async run(outgoingEdges) {
        if (this.type === TYPE.PROCESSOR) {
            this.setValue(await this.runProcessor())
        }
        this.highlight(true)
        this.highlightPort("output_1")
        let outputPortType = this.outputs[0] // assuming only one type of output port per node for now
        for (let edge of outgoingEdges) {
            edge.highlight(true)
            edge.targetNode.highlightPort(edge.portIn)
            edge.targetNode.incomingData.push({
                from: this.id,
                dataType: outputPortType,
                data: this.getValue()
            })
        }
        this.ranThisRound = true
    }

    highlight(bool) {
        let el = document.getElementById("node-" + this.id)
        if (bool) {
            el.classList.add("highlighted-node")
        } else {
            el.classList.remove("highlighted-node")
        }
    }

    highlightPort(portClass) {
        let nodeEl = document.getElementById("node-" + this.id)
        let inputDivs = nodeEl.querySelector(portClass.includes("input") ? ".inputs" : ".outputs").querySelectorAll("div")
        for (let div of inputDivs) {
            if (div.classList.contains(portClass)) {
                div.classList.add("highlighted-port")
            }
        }
    }

    unhighlightAllPorts() {
        let nodeEl = document.getElementById("node-" + this.id)
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

    initCodemirror(mode) { this.err() }
    getValue() { this.err() }
    setValue(value) { this.err() }
    clear() { this.err() }
    async runProcessor() { this.err() }

    err() {
        console.error("This 'abstract base method' should not be called")
    }
}
