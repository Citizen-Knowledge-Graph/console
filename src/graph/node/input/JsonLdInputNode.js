import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class JsonLdInputNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.JSONLD ], TYPE.INPUT)
    }
}
