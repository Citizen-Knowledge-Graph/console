import { TYPE, VIEW_MODE } from "../nodeFactory.js"

export class Node {
    constructor(initialValues, graph, inputs, outputs, type) {
        this.name = initialValues.name
        this.inputs = inputs
        this.outputs = outputs
        this.editor = graph.editor
        this.type = type
        this.id = "" + this.editor.addNode(this.name, inputs.length, outputs.length,
            initialValues.pos[0], initialValues.pos[1], "", {}, this.getHtml())
        this.nodeDiv = this.editor.container.querySelector(`#node-${this.id}`)
        graph.nodesMap[this.id] = this
        this.incomingData = []
        this.ranThisRound = false
        this.viewMode = VIEW_MODE.DEFAULT
        this.wasResized = false
        this.postConstructor()
        if (initialValues.value) this.setValue(initialValues.value)
        requestAnimationFrame(() => { // otherwise the height is not correct
            this.initialWidth = this.nodeDiv.offsetWidth
            this.initialHeight = this.nodeDiv.offsetHeight
            if (initialValues.size) this.setSize(initialValues.size[0], initialValues.size[1])
            if (initialValues.contentHidden) this.hideContent()
        })
        console.log("Node added:", this.id, "\"" + this.name)
    }

    resetSize() {
        this.setValue(this.getValue().trim())
        this.setSize(this.initialWidth, this.initialHeight)
        this.nodeDiv.style.removeProperty("width")
        this.nodeDiv.style.removeProperty("height")
        this.wasResized = false
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
        this.rerenderConnectingEdges()
        this.wasResized = true
    }

    rerenderConnectingEdges = () => {
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
            case TYPE.EDIT:
                return "edit-node"
            default:
                return ""
        }
    }

    getHtml() {
        return `
            <div>
                <div class="title-box ${this.getTitleBoxClass()}">
                    <div class="node-title" title="${this.constructor.name}">${this.name}</div>
                </div>
                <div class="box">
                    <div class="view-mode-button-container hidden">
                        <input type="button" class="show-content-btn" value="Show Content">
                    </div>
                    <div class="view-mode-default-container">
                        ${this.isProcessor() ? '<div class="result">Result:</div>' : ""}
                        ${this.getMainHtml() ?? ""}
                    </div>
                </div>
                <div class="resize-handle"></div>
            </div>`
    }

    hideContent() {
        this.nodeDiv.querySelector(".view-mode-default-container").classList.add("hidden")
        this.nodeDiv.querySelector(".view-mode-button-container").classList.remove("hidden")
    }

    unhideContent() {
        this.nodeDiv.querySelector(".view-mode-default-container").classList.remove("hidden")
        this.nodeDiv.querySelector(".view-mode-button-container").classList.add("hidden")
    }

    contentIsHidden() {
        return this.nodeDiv.querySelector(".view-mode-default-container").classList.contains("hidden")
    }

    setName(name) {
        this.name = name
        this.nodeDiv.querySelector(".node-title").textContent = name
    }

    postConstructor() {
        let showContentBtn = document.querySelector(`#node-${this.id} .show-content-btn`)
        showContentBtn.addEventListener("click", () => this.unhideContent())
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
        if (bool) {
            this.nodeDiv.classList.add("highlighted-node")
        } else {
            this.nodeDiv.classList.remove("highlighted-node")
        }
    }

    setSelected() {
        this.nodeDiv.classList.add("selected")
    }

    removeSelected() {
        this.nodeDiv.classList.remove("selected")
    }

    highlightPort(portClass) {
        let inputDivs = this.nodeDiv.querySelector(portClass.includes("input") ? ".inputs" : ".outputs").querySelectorAll("div")
        for (let div of inputDivs) {
            if (div.classList.contains(portClass)) {
                div.classList.add("highlighted-port")
            }
        }
    }

    unhighlightAllPorts() {
        let divs = this.nodeDiv.querySelectorAll(".inputs div, .outputs div")
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
    preResize() {}
    postResize(dy) {}

    getValue() { this.err() }
    setValue(value) { this.err() }
    clear() { this.err() }
    async processIncomingData() { this.err() }
    addInputPort() { this.err() }

    err() {
        console.error("This 'abstract base method' should not be called")
    }
}