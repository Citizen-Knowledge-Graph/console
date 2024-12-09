import { Node } from "./Node.js"

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
    }
}
