import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class ExternalSparqlEndpointInputNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.SPARQL_ENDPOINT ], TYPE.INPUT)
    }

    getInfo() {
        return `Enter one URL to a SPARQL endpoint.<br>SELECT and CONSTRUCT queries are supported.`
    }
}
