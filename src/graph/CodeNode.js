import { Node } from "./Node.js"
import { CodeMirror } from "../assets/bundle.js"

export class CodeNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        super(name, inputs, outputs, x, y, editor, nodesMap, type)
    }

    getHtml() {
        return `
<div>
    <div class="title-box${this.isProcessor() ? " view-only" : ""}">${this.name}</div>
    <div class="box">
        ${this.isProcessor() ? '<div class="result">Result:</div>' : ""}
        <div class="codemirror-editor"></div>
    </div>
</div>`
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
            lineNumbers: !this.isProcessor(),
            readOnly: this.isProcessor(),
        })
        this.codeMirror.setSize("100%", "100%")
        this.codeMirror.on("keydown", (cm, event) => {
            // otherwise Drawflow deletes the node
            if (event.key === "Delete") event.stopPropagation()
        })
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
