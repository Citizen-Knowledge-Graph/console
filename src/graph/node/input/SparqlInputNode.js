import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { SparqlParser } from "../../../assets/bundle.js"

export class SparqlInputNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.SPARQL ], TYPE.INPUT)
    }

    checkSyntax() {
        try {
            new SparqlParser().parse(this.getValue())
        } catch (err) {
            let msg = err.message.split("...")[0]
            msg = msg.substring(0, msg.length - 2)
            this.handleError(msg, err.message)
        }
    }
}
