import { CodeNode } from "../CodeNode.js"
import { TYPE } from "../nodeFactory.js"

export class PrefixesNode extends CodeNode {
    constructor(name, x, y, graph) {
        super(name, [], [], x, y, graph, TYPE.INPUT)
    }
}
