import { buildEdgeId } from "../utils.js"

export class Edge {
    constructor(conn, graph) {
        this.id = buildEdgeId(conn) // should be unique, no need for ensureUniqueId()
        this.sourceNode = graph.nodesMap[conn.output_id]
        this.targetNode = graph.nodesMap[conn.input_id]
        this.portOut = conn.output_class
        this.portIn = conn.input_class
        graph.edgesMap[this.id] = this
        console.log("Edge added:", this.id, this.sourceNode.id, "-->", this.targetNode.id, this)
    }

    static isInvalid(conn, graph) {
        let targetNode = graph.nodesMap[conn.input_id]
        let portIn = conn.input_class
        let isInvalid =
            Object.values(graph.edgesMap).some(edge => (edge.targetNode === targetNode && edge.portIn === portIn))
        if (isInvalid) {
            graph.editor.removeSingleConnection(conn.output_id, conn.input_id, conn.output_class, conn.input_class)
        }
        return isInvalid
    }

    highlight(bool) {
        let nodeOut = "node_out_node-" + this.sourceNode.id
        let nodeIn = "node_in_node-" + this.targetNode.id
        let el = document.querySelector(`svg.${nodeOut}.${nodeIn}.${this.portOut}.${this.portIn} path`)
        if (bool) {
            el.classList.add("highlighted-edge")
        } else {
            el.classList.remove("highlighted-edge")
        }
    }
}
