import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { Store } from "../../../assets/bundle.js"
import { runSparqlConstructQueryOnRdfString, serializeStoreToTurtle } from "../../../utils.js";

export class SparqlConstructExecNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.SPARQL ], [ PORT.TURTLE ], TYPE.PROCESSOR)
    }

    async processIncomingData() {
        try {
            let turtle = this.incomingData.filter(port => port.dataType === PORT.TURTLE)[0].data
            let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
            let constructedQuads = await runSparqlConstructQueryOnRdfString(sparql, turtle) // reuse the store being created there?
            let store = new Store()
            for (let quad of constructedQuads) store.addQuad(quad)
            return await serializeStoreToTurtle(store)
        } catch (err) {
            return this.handleError(err.message)
        }
    }
}
