import { Node } from "./Node.js"
import { CodeMirror } from "../assets/bundle.js"

export class CodeNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap) {
        super(name, inputs, outputs, x, y, editor, nodesMap)
        this.html = `
<div>
    <div class="title-box">${name}</div>
        <div class="box">
        <div class="codemirror-editor"></div>
    </div>
</div>`
        super.addNode()
    }

    initCodemirror(mode, canEdit, value = "") {
        let container = this.editor.container.querySelector(`#node-${this.editorId} .codemirror-editor`)
        if (!container) {
            console.warn(`${this.id}: codemirror container not found`)
            return
        }
        this.codeMirror = CodeMirror(container, {
            value: value,
            mode: mode, // sparql or turtle
            lineNumbers: canEdit,
            readOnly: !canEdit,
        })
        this.codeMirror.setSize('100%', '100%')
    }
}
