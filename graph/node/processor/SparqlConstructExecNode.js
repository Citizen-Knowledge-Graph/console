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
            let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
            let turtleInput = this.incomingData.filter(port => port.dataType === PORT.TURTLE)
            if (turtleInput.length > 0) {
                let constructedQuads = await runSparqlConstructQueryOnRdfString(sparql, turtleInput[0].data) // reuse the store being created there?
                let store = new Store()
                for (let quad of constructedQuads) store.addQuad(quad)
                return await serializeStoreToTurtle(store)
            }
            let sparqlEndpointInput = this.incomingData.filter(port => port.dataType === PORT.SPARQL_ENDPOINT)
            if (sparqlEndpointInput.length > 0) {
                let endpoint = sparqlEndpointInput[0].data
                let fullUrl = endpoint + "?query=" + encodeURIComponent(sparql)
                const response = await fetch(fullUrl, {
                    headers: { "Accept": "text/turtle" }
                })
                return await response.text()
            }
        } catch (err) {
            return this.handleError(err.message)
        }
    }
}
