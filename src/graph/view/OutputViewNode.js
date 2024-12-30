import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"

export class OutputViewNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.ANY ], [ PORT.ANY ], TYPE.VIEW)
    }

    async processIncomingData() {
        let type = this.incomingData[0].dataType
        let mode = "text/plain"
        if (type === PORT.SPARQL) mode = "sparql"
        if (type === PORT.TURTLE) mode = "turtle"
        this.codeMirror.setOption("mode", mode)
        return this.incomingData[0].data
    }
}
