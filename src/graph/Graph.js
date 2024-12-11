import { TYPE } from "./nodeFactory.js"

export class Graph {
    constructor() {
        this.nodesMap = {}
        this.edgesMap = {}
    }

    getNodeByEditorId(editorId) {
        return Object.values(this.nodesMap).find(node => node.editorId.toString() === editorId)
    }

    run() {
        // start with input nodes
        let inputNodes = Object.values(this.nodesMap).filter(node => node.type === TYPE.INPUT)
        for (let node of inputNodes) {
            let outgoingEdges = Object.values(this.edgesMap).filter(edge => edge.sourceNodeId === node.id)
            for (let edge of outgoingEdges) {
                let targetNode = this.nodesMap[edge.targetNodeId]
                node.handoverDataTo(targetNode)
            }
        }

        // TODO
    }
}
