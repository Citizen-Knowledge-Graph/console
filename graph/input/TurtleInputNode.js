import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE} from "../nodeFactory.js"

export class TurtleInputNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [], [ PORT.TURTLE ], x, y, editor, nodesMap, TYPE.INPUT)
        super.initCodemirror("turtle")
    }
}
