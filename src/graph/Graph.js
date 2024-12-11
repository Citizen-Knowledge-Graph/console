
export class Graph {
    constructor() {
        this.nodesMap = {}
        this.edgesMap = {}
    }

    getNodeByEditorId(editorId) {
        return Object.values(this.nodesMap).find(node => node.editorId.toString() === editorId)
    }

    run() {}

    async step() {
        // nodes that have not run this round yet and have either no input ports (Type.INPUT) or have all incoming data available (Type.PROCESSOR)
        let readyNodes = Object.values(this.nodesMap).filter(node => node.isReadyToRun())
        if (readyNodes.length === 0) {
            console.log("No nodes are ready to run, resetting graph")
            this.reset()
            return
        }
        for (let node of readyNodes) {
            let outgoingEdges = Object.values(this.edgesMap).filter(edge => edge.sourceNodeId === node.id)
            await node.run(outgoingEdges)
        }
        console.log("nodesMap", this.nodesMap)
    }

    reset() {
        for (let node of Object.values(this.nodesMap)) {
            node.ranThisRound = false
            node.incomingData = []
        }
    }
}
