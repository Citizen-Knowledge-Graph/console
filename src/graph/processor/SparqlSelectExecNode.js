import { TableNode } from "../TableNode.js"
import { PORT, TYPE } from "../nodeFactory.js"
import { runSparqlSelectQueryOnRdfString } from "../../utils.js"

export class SparqlSelectExecNode extends TableNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [ PORT.TURTLE, PORT.SPARQL ], [ PORT.CSV ], x, y, editor, nodesMap, TYPE.PROCESSOR)
    }

    async runProcessor() {
        let turtle = this.incomingData.filter(port => port.dataType === PORT.TURTLE)[0].data
        let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
        let rows = await runSparqlSelectQueryOnRdfString(sparql, turtle)

        // TODO

        return ""
    }
}
