import { CodeNode } from "../CodeNode.js"
import { PORT } from "../nodeFactory.js"

export class MergeTriplesNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], x, y, editor, nodesMap)
        super.initCodemirror("turtle", false)
    }
}
