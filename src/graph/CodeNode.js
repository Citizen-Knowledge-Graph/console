import { Node } from "./Node.js"
import { CodeMirror } from "../assets/bundle.js"
import { PORT } from "./nodeFactory.js"

export class CodeNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        super(name, inputs, outputs, x, y, editor, nodesMap, type)
    }

    getMainHtml() {
        return `<div class="codemirror-container"></div>`
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
        // this.codeMirror.on("change", () => { this.codeMirror.lineCount() })
    }

    startResizing() {
        this.resizeStartHeight = this.codemirrorContainer.offsetHeight
    }

    resizing(dy) {
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
        this.editor.updateConnectionNodes(`node-${this.id}`)
    }

    clear() {
        this.setValue("")
    }
}
