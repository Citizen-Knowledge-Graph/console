import { ensureUniqueId } from "../utils.js"

export class Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        this.name = name
        this.inputs = inputs
        this.outputs = outputs
        this.x = x
        this.y = y
        this.editor = editor
        this.nodesMap = nodesMap
        this.type = type
        this.html = ''
    }

    addNode() {
        this.editorId = this.editor.addNode(this.name, this.inputs.length, this.outputs.length, this.x, this.y, "", {}, this.html)
        this.editorNodeObj = this.editor.getNodeFromId(this.editorId)
        this.id = ensureUniqueId(this.name, this.nodesMap)
        this.nodesMap[this.id] = this
        console.log("Node added:", this.id, "\"" + this.name + "\"", "at", this.x, "/", this.y)
    }
}
