import { buildEdgeId } from "../utils.js"

export class Edge {
    constructor(editorConnectionObj, graph) {
        this.editorConnectionObj = editorConnectionObj
        this.edgesMap = graph.edgesMap
        this.id = buildEdgeId(editorConnectionObj) // should be unique, no need for ensureUniqueId()
        let sourceNode = graph.getNodeByEditorId(editorConnectionObj.output_id)
        let targetNode = graph.getNodeByEditorId(editorConnectionObj.input_id)
        this.sourceNodeId = sourceNode.id
        this.targetNodeId = targetNode.id
        this.edgesMap[this.id] = this
        console.log("Edge added:", this.id, this.sourceNodeId, "-->", this.targetNodeId, this)
    }
}
