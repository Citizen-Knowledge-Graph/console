import { Node } from "./node.js"

export class CodeNode extends Node {
    constructor(name, x, y, editor, nodesMap) {
        super(name, x, y, editor, nodesMap)

        this.html = `
<div>
    <div class="title-box">${name}</div>
        <div class="box">
        <div class="codemirror-editor"></div>
    </div>
</div>`
        super.addNode()
    }
}
