import { buildEdgeId } from "../utils.js"

export class Edge {
    constructor(editorConnectionObj, graph) {
        this.exportId = "edge" + Object.keys(graph.edgesMap).length
        this.editorConnectionObj = editorConnectionObj
        this.edgesMap = graph.edgesMap
        this.id = buildEdgeId(editorConnectionObj) // should be unique, no need for ensureUniqueId()
        this.sourceNode = graph.getNodeByEditorId(editorConnectionObj.output_id)
        this.targetNode = graph.getNodeByEditorId(editorConnectionObj.input_id)
        this.portOut = this.editorConnectionObj.output_class
        this.portIn = this.editorConnectionObj.input_class
        this.edgesMap[this.id] = this
        console.log("Edge added:", this.id, this.sourceNode.id, "-->", this.targetNode.id, this)
    }

    highlight(bool) {
        let nodeOut = "node_out_node-" + this.editorConnectionObj.output_id
        let nodeIn = "node_in_node-" + this.editorConnectionObj.input_id
        let el = document.querySelector(`svg.${nodeOut}.${nodeIn}.${this.portOut}.${this.portIn} path`)
        if (bool) {
            el.classList.add("highlighted-edge")
        } else {
            el.classList.remove("highlighted-edge")
        }
    }
}
