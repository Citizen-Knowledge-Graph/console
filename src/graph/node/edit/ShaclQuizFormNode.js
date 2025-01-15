import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class ShaclQuizFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = null // internal state
        this.inputTurtles = {}
    }

    getMainHtml() {
        return `<div class="shacl-quiz-form-container" style="margin: 0 0 20px 10px"/>`
    }

    addInputPort() {
        super.addInputPortOfType(PORT.TURTLE)
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["Datafield definitions", "Existing user profile", "Requirement profile"])
        this.assignTitlesToPorts("output", ["Profile", "Internal state", "Validation result", "Priority list", "Eligibility status"])
        let container = this.nodeDiv.querySelector(".shacl-quiz-form-container")
        container.style.cursor = "default"
        container.addEventListener("mousedown", event => event.stopPropagation())
    }

    async serializeOutput() {}

    async update() {}

    async processIncomingData() {
        let dfs = this.incomingData[0].data
        let up = this.incomingData[1].data
        let rps = [ this.incomingData[2].data ]
        for (let i = 3; i < this.inputs.length; i++) {
            rps.push(this.incomingData[i].data)
        }
        // leaving out the diff check for now, add it back in TODO
        this.inputTurtles = { dfs, up, currentUp: up, rps }
        await this.rebuildInternalState()
        return ""
    }

    async rebuildInternalState() {}

    async rebuildForm() {
        this.rerenderConnectingEdges()
        await this.update()
    }

    getValue() { return "" }
    setValue(value) {}
}
