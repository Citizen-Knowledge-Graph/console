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

    highlight(bool) {
        let nodeOut = "node_out_node-" + this.editorConnectionObj.output_id
        let portOut = this.editorConnectionObj.output_class
        let nodeIn = "node_in_node-" + this.editorConnectionObj.input_id
        let portIn = this.editorConnectionObj.input_class
        let el = document.querySelector(`svg.${nodeOut}.${nodeIn}.${portOut}.${portIn} path`)
        if (bool) {
            el.classList.add("highlighted-edge")
        } else {
            el.classList.remove("highlighted-edge")
        }
    }
}
