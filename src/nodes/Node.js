import { slugify } from "../assets/bundle.js"

export const PORT = {
    ANY: 1,
    TURTLE: 2,
    SPARQL_SELECT: 3,
    SPARQL_CONSTRUCT: 4,
    SHACL: 5
}

export class Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap) {
        this.name = name
        this.inputs = inputs
        this.outputs = outputs
        this.x = x
        this.y = y
        this.editor = editor
        this.nodesMap = nodesMap
        this.html = ''
    }

    addNode() {
        this.editorId = this.editor.addNode(this.name, this.inputs.length, this.outputs.length, this.x, this.y, "", {}, this.html)
        this.editorNodeObj = this.editor.getNodeFromId(this.editorId)
        this.id = slugify(this.name, { lower: true })
        if (this.nodesMap.hasOwnProperty(this.id)) {
            let i = 1
            while (this.nodesMap.hasOwnProperty(this.id + "-" + i)) i ++
            this.id = this.id + "-" + i
        }
        this.nodesMap[this.id] = this
        console.log("Node added:", this.id, "\"" + this.name + "\"", "at", this.x, "/", this.y)
    }
}
