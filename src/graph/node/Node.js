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
        this.graph = graph
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
        console.log("Node added:", this.id, "\"" + this.name + "\"")
    }

    handleError(msg, tooltip = "") {
        let el = this.nodeDiv.querySelector(".result")
        if (el) el.style.display = "none"
        this.nodeDiv.style.border = "2px solid red"
        let errEl = this.nodeDiv.querySelector(".errorMsg")
        errEl.innerHTML = msg
        errEl.title = tooltip
        this.graph.handleNodeError(this)
        return ""
    }

    resetError() {
        let el = this.nodeDiv.querySelector(".result")
        if (el) el.style.display = ""
        this.nodeDiv.style.border = ""
        this.nodeDiv.querySelector(".errorMsg").innerHTML = ""
    }

    resetSize() {
        this.setValue(this.getValueForExport().trim())
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
        this.postResize(dy, width, height)
        this.rerenderConnectingEdges()
        this.wasResized = true
    }

    rerenderConnectingEdges() {
        this.editor.updateConnectionNodes("node-" + this.id)
    }

    refreshAfterAppliedSettings() {
        this.rerenderConnectingEdges()
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
            case TYPE.VIEW_LEAF:
                return "view-leaf-node"
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
                    <div class="errorMsg" style="color: red"></div>
                    <div class="view-mode-button-container hidden">
                        <input type="button" class="show-content-btn" value="Show Content">
                    </div>
                    <div class="view-mode-default-container">
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

    countIncomingEdges() {
        return Object.values(this.graph.edgesMap).filter(edge => edge.targetNode === this).length
    }

    async run() {
        if (this.isInput()) {
            await this.inputNodePreRun()
        } else {
            this.setValue(await this.processIncomingData())
        }
        this.highlight(true)
        this.highlightPort("output_1")
        let outputPortType = this.outputs[0] // assuming only one type of output port per node for now
        let outgoingEdges = Object.values(this.graph.edgesMap).filter(edge => edge.sourceNode === this)
        for (let edge of outgoingEdges) {
            edge.highlight(true)
            edge.targetNode.receiveDataPackage({
                from: this,
                dataType: outputPortType,
                viaEdge: edge,
                data: this.getValue()
            })
        }
        this.ranThisRound = true
    }

    receiveDataPackage(dataPackage) {
        this.highlightPort(dataPackage.viaEdge.portIn)
        this.incomingData.push(dataPackage)
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

    getPortDivs(io) {
        return this.nodeDiv.querySelector(io === "input" ? ".inputs" : ".outputs").querySelectorAll("div")
    }

    assignTitlesToPorts(io, titles) {
        let portDivs = this.getPortDivs(io)
        for (let i = 0; i < titles.length; i++) {
            portDivs[i].title = titles[i]
        }
    }

    highlightPort(portClass) {
        let portDivs = this.getPortDivs(portClass.includes("input") ? "input" : "output")
        for (let div of portDivs) {
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
        return !this.ranThisRound && (this.inputs.length === 0 || this.enoughIncomingDataAvailable())
    }

    enoughIncomingDataAvailable() {
        return this.incomingData.length === this.inputs.length
    }

    hasAsMuchIncomingDataAvailableAsIncomingEdges() {
        return this.countIncomingEdges() === this.incomingData.length
    }

    ensureNumberOfInputPorts(numb) {
        if (this.inputs.length < numb) for (let i = this.inputs.length; i < numb; i++) this.addInputPort()
    }

    addInputPortOfType(type) {
        this.editor.addNodeInput(this.id)
        this.inputs.push(type)
    }

    receiveCopyPasteValue(value) {
        this.setValue(value)
    }

    getValueForExport() {
        return this.getValue()
    }

    sendInstantShowValue(portOut, content) {
        let outgoingEdges = Object.values(this.graph.edgesMap).filter(edge => edge.sourceNode === this)
        let edge = outgoingEdges.find(edge => edge.portOut === portOut)
        if (!edge || !(["OutputViewLeafNode", "OutputViewTableLeafNode"].includes(edge.targetNode.constructor.name))) return
        edge.targetNode.instantShowValue(content, "turtle")
    }

    getMainHtml() {}
    preResize() {}
    postResize(dy) {}
    inputNodePreRun() {}

    getValue() { this.err() }
    setValue(value) { this.err() }
    instantShowValue(value, mode) { this.err() }
    clear() { this.err() }
    async processIncomingData() { this.err() }
    addInputPort() { this.err() }
    onCodeMirrorChange() { this.err() }
    saveInitialValue() { this.err() }

    err() {
        console.error("This 'abstract base method' should not be called")
    }
}
