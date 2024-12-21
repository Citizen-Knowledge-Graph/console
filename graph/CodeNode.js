import { Node } from "./Node.js"
import { CodeMirror } from "../assets/bundle.js"

export class CodeNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        super(name, inputs, outputs, x, y, editor, nodesMap, type)
    }

    getMainHtml() {
        return `<div class="codemirror-editor"></div>`
    }

    initCodemirror(mode) {
        let container = this.editor.container.querySelector(`#node-${this.id} .codemirror-editor`)
        if (!container) {
            console.warn(`${this.id}: codemirror container not found`)
            return
        }
        this.codeMirror = CodeMirror(container, {
            value: "",
            mode: mode, // sparql or turtle
            lineNumbers: this.isInput(),
            readOnly: !this.isInput()
        })
        this.codeMirror.setSize("100%", "100%")
        this.codeMirror.on("mousedown", (cm, event) => event.stopPropagation())
        this.codeMirror.on("keydown", (cm, event) => {
            // otherwise Drawflow deletes the node
            if (event.key === "Delete") event.stopPropagation()
        })
        // this.codeMirror.on("change", () => { this.codeMirror.lineCount() })
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
