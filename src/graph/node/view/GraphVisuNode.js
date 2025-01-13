import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class GraphVisuNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [], TYPE.VIEW)
    }
}
