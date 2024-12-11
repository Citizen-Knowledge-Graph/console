import { TYPE } from "./nodeFactory.js"

export class Graph {
    constructor() {
        this.nodesMap = {}
        this.edgesMap = {}
    }

    getNodeByEditorId(editorId) {
        return Object.values(this.nodesMap).find(node => node.editorId.toString() === editorId)
    }

    run() {}
}
