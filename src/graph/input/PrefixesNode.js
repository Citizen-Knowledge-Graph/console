import { CodeNode } from "../CodeNode.js"
import { TYPE } from "../nodeFactory.js"

export class PrefixesNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [], [], x, y, editor, nodesMap, TYPE.INPUT)
    }
}
