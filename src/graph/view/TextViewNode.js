import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"

export class TextViewNode extends CodeNode {
    constructor(name, x, y, graph) {
        super(name, [ PORT.ANY ], [ PORT.ANY ], x, y, graph, TYPE.VIEW)
    }

    async processIncomingData() {
        return this.incomingData[0].data
    }
}
