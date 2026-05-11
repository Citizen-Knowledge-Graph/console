import { CodeNode } from "../CodeNode.js"
import { TYPE } from "../../nodeFactory.js"

export class PrefixesNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [], TYPE.INPUT)
    }
}
