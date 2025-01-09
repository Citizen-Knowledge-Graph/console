import { Node } from "./Node.js"
import { CodeMirror } from "../../assets/bundle.js"
import { PORT } from "../nodeFactory.js"

export class CodeNode extends Node {
    constructor(initialValues, graph, inputs, outputs, type) {
        super(initialValues, graph, inputs, outputs, type)
    }

    getMainHtml() {
        return `
            <div class="result">Result:</div>
            <div class="codemirror-container"></div>`
    }

    getMode() {
        if (this.outputs.length === 0) return "text/plain"
        if (this.outputs[0] === PORT.SPARQL) return "sparql"
        if (this.outputs[0] === PORT.TURTLE) return "turtle"
        return "text/plain"
    }

    postConstructor() {
        super.postConstructor()
        this.codemirrorContainer = this.editor.container.querySelector(`#node-${this.id} .codemirror-container`)
        this.codeMirror = CodeMirror(this.codemirrorContainer, {
            value: "",
            mode: this.getMode(),
            lineNumbers: this.isInput(),
            readOnly: !this.isInput(),
            // lineWrapping: true
        })
        this.codeMirror.setSize("100%", "100%")
        this.codeMirror.on("mousedown", (cm, event) => event.stopPropagation())
        this.codeMirror.on("keydown", (cm, event) => {
            // otherwise Drawflow deletes the node
            if (event.key === "Delete") event.stopPropagation()
        })
        this.codeMirror.on("change", () => this.onCodeMirrorChange())
    }

    onCodeMirrorChange() {
        let copyPasteReceiverNodes = Object.values(this.graph.edgesMap)
            .filter(edge => edge.sourceNode === this)
            .filter(edge => edge.targetNode.constructor.name === "TurtleInputNodeWithCopyPasteInPort")
            .map(edge => edge.targetNode)
        for (let node of copyPasteReceiverNodes) node.receiveCopyPasteValue(this.getValue())
    }

    preResize() {
        this.resizeStartHeight = this.codemirrorContainer.offsetHeight
    }

    postResize(dy) {
        this.codemirrorContainer.style.height = this.resizeStartHeight + dy + "px"
        // this.codeMirror.refresh()
    }

    resetSize() {
        super.resetSize()
        this.codemirrorContainer.style.height = ""
    }

    getValue() {
        return this.codeMirror.getValue()
    }

    setValue(value) {
        this.codeMirror.setValue(value)
        this.rerenderConnectingEdges()
    }

    hideContent() {
        super.hideContent()
        this.rerenderConnectingEdges()
    }

    unhideContent() {
        super.unhideContent()
        this.codeMirror.refresh()
        this.rerenderConnectingEdges()
    }

    refreshAfterAppliedSettings() {
        super.refreshAfterAppliedSettings()
        this.codeMirror.refresh()
    }

    clear() {
        this.setValue("")
    }
}
