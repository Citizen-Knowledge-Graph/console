import { Node } from "./Node.js"
import { CodeMirror } from "../assets/bundle.js"

export class CodeNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        super(name, inputs, outputs, x, y, editor, nodesMap, type)
    }

    getMainHtml() {
        return `<div class="codemirror-container"></div>`
    }

    initCodemirror(mode) {
        this.codemirrorContainer = this.editor.container.querySelector(`#node-${this.id} .codemirror-container`)
        this.codeMirror = CodeMirror(this.codemirrorContainer, {
            value: "",
            mode: mode, // sparql or turtle
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
        this.codeMirror.refresh()
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
