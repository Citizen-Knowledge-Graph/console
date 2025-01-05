import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class TurtleInputNodeWithCopyPasteInPort extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT. TURTLE ], [ PORT.TURTLE ], TYPE.INPUT)
    }

    enoughIncomingDataAvailable() {
        return true
    }
}
