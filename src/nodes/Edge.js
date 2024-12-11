import { ensureUniqueId } from "../utils.js"

export class Edge {
    constructor(outNodeId, inNodeId, edgesMap, editorEdgeObj) {
        this.outNodeId = outNodeId
        this.inNodeId = inNodeId
        this.edgesMap = edgesMap
        this.editorEdgeObj = editorEdgeObj
        this.id = ensureUniqueId(`${outNodeId}-${inNodeId}`, edgesMap)
        this.edgesMap[this.id] = this
        console.log("Edge added:", this.id, this.outNodeId, "-->", this.inNodeId)
    }
}
