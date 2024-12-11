import { ensureUniqueId } from "../utils.js"

export class Edge {
    constructor(sourceNodeId, targetNodeId, edgesMap, editorEdgeObj) {
        this.sourceNodeId = sourceNodeId
        this.targetNodeId = targetNodeId
        this.edgesMap = edgesMap
        this.editorEdgeObj = editorEdgeObj
        this.id = ensureUniqueId(`${sourceNodeId}-${targetNodeId}`, edgesMap)
        this.edgesMap[this.id] = this
        console.log("Edge added:", this.id, this.sourceNodeId, "-->", this.targetNodeId)
    }
}
