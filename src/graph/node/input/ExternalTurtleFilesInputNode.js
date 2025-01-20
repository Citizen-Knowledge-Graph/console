import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class ExternalTurtleFilesInputNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.TURTLE ], TYPE.INPUT)
    }
}
