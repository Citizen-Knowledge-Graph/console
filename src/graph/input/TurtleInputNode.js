import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"

export class TurtleInputNode extends CodeNode {
    constructor(name, x, y, graph) {
        super(name, [], [ PORT.TURTLE ], x, y, graph, TYPE.INPUT)
    }
}
