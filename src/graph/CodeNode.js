import { Node } from "./Node.js"
import { CodeMirror } from "../assets/bundle.js"
import { TYPE } from "./nodeFactory.js"

export class CodeNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, isProcessor) {
        super(name, inputs, outputs, x, y, editor, nodesMap, isProcessor ? TYPE.PROCESSOR : TYPE.INPUT)
        this.isProcessor = isProcessor
        this.html = `
<div>
    <div class="title-box${isProcessor ? " view-only" : ""}">${name}</div>
    <div class="box">
        ${isProcessor ? '<div class="result">Result:</div>' : ""}
        <div class="codemirror-editor"></div>
    </div>
</div>`
        super.addNode()
    }

    initCodemirror(mode, value = "") {
        let container = this.editor.container.querySelector(`#node-${this.editorId} .codemirror-editor`)
        if (!container) {
            console.warn(`${this.id}: codemirror container not found`)
            return
        }
        this.codeMirror = CodeMirror(container, {
            value: value,
            mode: mode, // sparql or turtle
            lineNumbers: !this.isProcessor,
            readOnly: this.isProcessor,
        })
        this.codeMirror.setSize("100%", "100%")
        this.codeMirror.on("keydown", (cm, event) => {
            // otherwise Drawflow deletes the node
            if (event.key === "Delete") event.stopPropagation()
        })
    }

    async run(outgoingEdges) {
        if (this.type === TYPE.PROCESSOR) {
            this.setValue(await this.runProcessor())
        }
        super.run(outgoingEdges, this.codeMirror.getValue())
    }

    setValue(value) {
        this.codeMirror.setValue(value)
        this.editor.updateConnectionNodes(`node-${this.editorId}`)
    }

    clear() {
        this.setValue("")
    }
}
