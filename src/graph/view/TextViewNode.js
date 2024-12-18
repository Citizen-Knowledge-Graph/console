import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"

export class TextViewNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [ PORT.ANY ], [], x, y, editor, nodesMap, TYPE.VIEW)
        super.initCodemirror("text/plain")
    }

    async processIncomingData() {
        return this.incomingData[0].data
    }
}
