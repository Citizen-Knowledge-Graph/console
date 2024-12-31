import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
    }
}
