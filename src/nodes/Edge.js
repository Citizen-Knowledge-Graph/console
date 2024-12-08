export class Edge {
    constructor(outNodeId, outPortId, inNodeId, inPortId, edgesMap) {
        this.outNodeId = outNodeId
        this.outPortId = outPortId
        this.inNodeId = inNodeId
        this.inPortId = inPortId
        this.id = `${outNodeId}-${outPortId}-${inNodeId}-${inPortId}`
        this.edgesMap = edgesMap
        this.edgesMap[this.id] = this
    }
}
