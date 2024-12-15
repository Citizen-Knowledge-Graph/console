import { buildEdgeId } from "../utils.js"

export class Edge {
    constructor(editorConnectionObj, graph) {
        this.id = buildEdgeId(editorConnectionObj) // should be unique, no need for ensureUniqueId()
        this.sourceNode = graph.getNodeByEditorId(editorConnectionObj.output_id)
        this.targetNode = graph.getNodeByEditorId(editorConnectionObj.input_id)
        this.portOut = editorConnectionObj.output_class
        this.portIn = editorConnectionObj.input_class
        graph.edgesMap[this.id] = this
        console.log("Edge added:", this.id, this.sourceNode.id, "-->", this.targetNode.id, this)
    }

    highlight(bool) {
        let nodeOut = "node_out_node-" + this.sourceNode.editorId
        let nodeIn = "node_in_node-" + this.targetNode.editorId
        let el = document.querySelector(`svg.${nodeOut}.${nodeIn}.${this.portOut}.${this.portIn} path`)
        if (bool) {
            el.classList.add("highlighted-edge")
        } else {
            el.classList.remove("highlighted-edge")
        }
    }
}
