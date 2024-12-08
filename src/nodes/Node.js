import { slugify } from "../assets/bundle.js"

export class Node {
    constructor(name, x, y, editor, nodesMap) {
        this.name = name
        this.x = x
        this.y = y
        this.editor = editor
        this.nodesMap = nodesMap
        this.html = ''
    }

    addNode() {
        this.editorId = this.editor.addNode(this.name, 0, 0, this.x, this.y, "", {}, this.html)
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
