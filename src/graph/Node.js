import { TYPE, VIEW_MODE } from "./nodeFactory.js"

export class Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        this.name = name
        this.inputs = inputs
        this.outputs = outputs
        this.editor = editor
        this.nodesMap = nodesMap
        this.type = type
        this.id = "" + editor.addNode(name, inputs.length, outputs.length, x, y, "", {}, this.getHtml())
        this.nodeDiv = editor.container.querySelector(`#node-${this.id}`)
        this.nodesMap[this.id] = this
        this.incomingData = []
        this.ranThisRound = false
        this.viewMode = VIEW_MODE.DEFAULT
        console.log("Node added:", this.id, "\"" + this.name)
        this.postConstructor()
        requestAnimationFrame(() => { // otherwise the height is not correct
            this.initialWidth = this.nodeDiv.offsetWidth
            this.initialHeight = this.nodeDiv.offsetHeight
        })
    }

    resetSize() {
        this.setSize(this.initialWidth, this.initialHeight)
    }

    hasDefaultSize() {
        return this.nodeDiv.offsetWidth === this.initialWidth && this.nodeDiv.offsetHeight === this.initialHeight
    }

    getSize() {
        return { width: this.nodeDiv.offsetWidth, height: this.nodeDiv.offsetHeight }
    }

    setSize(width, height, dy) {
        if (!dy) { // then it's a one-time resize event via import, not a continuous resizing event from index.html
            this.preResize()
            dy = height - this.nodeDiv.offsetHeight
        }
        this.nodeDiv.style.setProperty("width", width + "px", "important")
        this.nodeDiv.style.setProperty("height", height + "px", "important")
        this.postResize(dy)
        this.editor.updateConnectionNodes("node-" + this.id)
    }

    isProcessor() {
        return this.type === TYPE.PROCESSOR
    }

    isInput() {
        return this.type === TYPE.INPUT
    }

    getTitleBoxClass() {
        switch (this.type) {
            case TYPE.PROCESSOR:
                return "processor-node"
            case TYPE.VIEW:
                return "view-node"
            default:
                return ""
        }
    }

    getHtml() {
        return `
            <div>
                <div class="title-box ${this.getTitleBoxClass()}">${this.name}</div>
                <div class="box">
                    <div class="view-mode-button-container hidden">
                        <input type="button" class="modal-open-btn" value="Show Content">
                    </div>
                    <div class="view-mode-default-container">
                        ${this.isProcessor() ? '<div class="result">Result:</div>' : ""}
                        ${this.getMainHtml() ?? ""}
                        ${this.getBottomMenuHtml() ?? ""}
                    </div>
                </div>
                <div class="resize-handle"></div>
            </div>`
    }

    postConstructor() {
        let modalOpenBtn = document.querySelector(`#node-${this.id} .modal-open-btn`)
        modalOpenBtn.addEventListener("click", () => {
            document.getElementById("modal-container").classList.remove("hidden")
            // TODO
        })
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === VIEW_MODE.DEFAULT ? VIEW_MODE.BUTTON : VIEW_MODE.DEFAULT
        const toggleHidden = cls => {
            this.editor.container.querySelector(`#node-${this.id} .${cls}`).classList.toggle("hidden")
        }
        toggleHidden("view-mode-button-container")
        toggleHidden("view-mode-default-container")
        // TODO
    }

    async run(outgoingEdges) {
        if (!this.isInput()) {
            this.setValue(await this.processIncomingData())
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

    addInputPortOfType(type) {
        this.editor.addNodeInput(this.id)
        this.inputs.push(type)
    }

    getMainHtml() {}
    getBottomMenuHtml() {}
    preResize() {}
    postResize(dy) {}

    initCodemirror(mode) { this.err() }
    getValue() { this.err() }
    setValue(value) { this.err() }
    clear() { this.err() }
    async processIncomingData() { this.err() }
    addInputPort() { this.err() }

    err() {
        console.error("This 'abstract base method' should not be called")
    }
}
