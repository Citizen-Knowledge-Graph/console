import { CodeNode } from "./CodeNode.js"
import { PORT } from "./nodeFactory.js"

export class SparqlConstructExecNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [ PORT.TURTLE, PORT.SPARQL_CONSTRUCT ], [ PORT.TURTLE ], x, y, editor, nodesMap)
        super.addNode()
    }
}
