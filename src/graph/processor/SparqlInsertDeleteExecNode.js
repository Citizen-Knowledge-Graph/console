import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"
import { addRdfStringToStore, runSparqlInsertDeleteQueryOnStore, serializeStoreToTurtle } from "../../utils.js"
import { Store } from "../../assets/bundle.js"

export class SparqlInsertDeleteExecNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.SPARQL ], [ PORT.TURTLE ], TYPE.PROCESSOR)
    }

    async processIncomingData() {
        let turtle = this.incomingData.filter(port => port.dataType === PORT.TURTLE)[0].data
        let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
        let store = new Store()
        await addRdfStringToStore(turtle, store)
        await runSparqlInsertDeleteQueryOnStore(sparql, store)
        return await serializeStoreToTurtle(store)
    }
}
