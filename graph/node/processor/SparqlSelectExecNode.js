import { TableNode } from "../TableNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { prefixes, runSparqlSelectQueryOnRdfString } from "../../../utils.js"
import { SparqlParser } from "../../../assets/bundle.js"

export class SparqlSelectExecNode extends TableNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.SPARQL ], [ PORT.CSV ], TYPE.PROCESSOR)
    }

    dePrefix(value) {
        for (let [key, val] of Object.entries(prefixes)) {
            value = value.replaceAll(val, key + ":")
        }
        return value
    }

    async processIncomingData() {
        try {
            let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
            let queryObj = new SparqlParser({ sparqlStar: true }).parse(sparql)
            if (queryObj.queryType !== "SELECT") {
                return this.handleError("Only SPARQL SELECT queries are supported")
            }
            let variables = []
            if (!(queryObj.variables.length === 1 && queryObj.variables[0].value === "*")) {
                // this is so that the order is being honored, later when collecting keys it won't
                for (let vari of queryObj.variables) {
                    if (vari.value) variables.push(vari.value)
                    if (vari.variable) variables.push(vari.variable.value)
                }
            }
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
            if (variables.length === 0) {
                // collect all variables from all the rows
                let keys = {}
                for (let result of results) {
                    for (let key of Object.keys(result)) {
                        keys[key] = true
                    }
                }
                variables = Object.keys(keys)
            }
            let rows = []
            let fullRows = [] // not de-prefixed
            for (let result of results) {
                let row = []
                let fullRow = []
                for (let variable of variables) {
                    let value = result[variable] ?? ""
                    row.push(this.dePrefix(value))
                    fullRow.push(value)
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
