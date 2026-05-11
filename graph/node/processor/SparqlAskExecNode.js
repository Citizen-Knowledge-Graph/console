import { runSparqlAskQueryOnRdfString } from "../../../utils.js"
import { SparqlParser } from "../../../assets/bundle.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { CodeNode } from "../CodeNode.js"

export class SparqlAskExecNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.SPARQL ], [], TYPE.PROCESSOR)
    }

    async processIncomingData() {
        try {
            let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
            let queryObj = new SparqlParser({ sparqlStar: true }).parse(sparql)
            if (queryObj.queryType !== "ASK") {
                return this.handleError("Only SPARQL ASK queries are supported")
            }
            let turtleInput = this.incomingData.filter(port => port.dataType === PORT.TURTLE)
            if (turtleInput.length > 0) {
                let result = await runSparqlAskQueryOnRdfString(sparql, turtleInput[0].data)
                return String(result)
            }
            let sparqlEndpointInput = this.incomingData.filter(port => port.dataType === PORT.SPARQL_ENDPOINT)
            if (sparqlEndpointInput.length > 0) {
                let endpoint = sparqlEndpointInput[0].data
                let fullUrl = endpoint + "?query=" + encodeURIComponent(sparql)
                let response = await fetch(fullUrl, {
                    headers: { "Accept": "application/sparql-results+json" }
                })
                let data = await response.json()
                return String(data.boolean)
            }
        } catch (err) {
            return this.handleError(err.message)
        }
    }
}
