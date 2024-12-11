import { CodeNode } from "../CodeNode.js"
import { PORT } from "../nodeFactory.js"

export class SparqlInputNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [], [ PORT.SPARQL ], x, y, editor, nodesMap)
        super.addNode()
    }
}
