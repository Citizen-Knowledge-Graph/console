import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"

export class TextViewNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.ANY ], [ PORT.ANY ], TYPE.VIEW)
    }

    async processIncomingData() {
        return this.incomingData[0].data
    }
}
