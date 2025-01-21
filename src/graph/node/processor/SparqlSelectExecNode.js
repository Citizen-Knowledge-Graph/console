import { TableNode } from "../TableNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { prefixes, runSparqlSelectQueryOnRdfString } from "../../../utils.js"

export class SparqlSelectExecNode extends TableNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.SPARQL ], [ PORT.CSV ], TYPE.PROCESSOR)
    }

    dePrefix(value) {
        for (let [key, val] of Object.entries(prefixes)) {
            if (value.startsWith(val)) {
                return value.replace(val, key + ":")
            }
        }
        return value
    }

    async processIncomingData() {
        try {
            let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
            let turtleInput = this.incomingData.filter(port => port.dataType === PORT.TURTLE)
            let results
            if (turtleInput.length > 0) {
                results = await runSparqlSelectQueryOnRdfString(sparql, turtleInput[0].data)
            }
            let sparqlEndpointInput = this.incomingData.filter(port => port.dataType === PORT.SPARQL_ENDPOINT)
            if (sparqlEndpointInput.length > 0) {
                let endpoint = sparqlEndpointInput[0].data
                let fullUrl = endpoint + "?query=" + encodeURIComponent(sparql)
                let response = await fetch(fullUrl, {
                    headers: { "Accept": "application/sparql-results+json" }
                })
                let data = await response.json()
                results = []
                for (let binding of data.results.bindings) {
                    let row = {}
                    Object.entries(binding).forEach(([queryVar, obj]) => {
                        row[queryVar] = obj.value
                    })
                    results.push(row)
                }
            }
            let variables = Object.keys(results[0]) // assuming they don't change between rows
            let rows = []
            let fullRows = [] // not de-prefixed
            for (let result of results) {
                let row = []
                let fullRow = []
                for (let variable of variables) {
                    row.push(this.dePrefix(result[variable]))
                    fullRow.push(result[variable])
                }
                rows.push(row)
                fullRows.push(fullRow)
            }
            return {
                headers: variables,
                rows: rows,
                fullRows: fullRows
            }
        } catch (err) {
            return this.handleError(err.message)
        }
    }
}
