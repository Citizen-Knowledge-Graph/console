import { TableNode } from "../TableNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { runSparqlSelectQueryOnRdfString } from "../../../utils.js"

export class SparqlSelectExecNode extends TableNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.SPARQL ], [ PORT.CSV ], TYPE.PROCESSOR)
        this.prefixesMap = {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "ff":  "https://foerderfunke.org/default#",
            "sh":  "http://www.w3.org/ns/shacl#",
        }
    }

    dePrefix(value) {
        for (let [key, val] of Object.entries(this.prefixesMap)) {
            if (value.startsWith(val)) {
                return value.replace(val, key + ":")
            }
        }
        return value
    }

    async processIncomingData() {
        let turtle = this.incomingData.filter(port => port.dataType === PORT.TURTLE)[0].data
        let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
        let results = await runSparqlSelectQueryOnRdfString(sparql, turtle)
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
    }
}
