import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"

export class SparqlInputNode extends CodeNode {
    constructor(name, x, y, graph) {
        super(name, [], [ PORT.SPARQL ], x, y, graph, TYPE.INPUT)
    }
}
