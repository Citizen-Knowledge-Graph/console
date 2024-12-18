import { TableNode } from "../TableNode.js"
import { PORT, TYPE } from "../nodeFactory.js"
import { runSparqlSelectQueryOnRdfString } from "../../utils.js"

export class SparqlSelectExecNode extends TableNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [ PORT.TURTLE, PORT.SPARQL ], [ PORT.CSV ], x, y, editor, nodesMap, TYPE.PROCESSOR)
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

    async runProcessor() {
        let turtle = this.incomingData.filter(port => port.dataType === PORT.TURTLE)[0].data
        let sparql = this.incomingData.filter(port => port.dataType === PORT.SPARQL)[0].data
        let results = await runSparqlSelectQueryOnRdfString(sparql, turtle)
        let variables = Object.keys(results[0]) // assuming they don't change between rows
        let rows = []
        for (let result of results) {
            let row = []
            for (let variable of variables) {
                row.push(this.dePrefix(result[variable]))
            }
            rows.push(row)
        }
        return {
            headers: variables,
            rows: rows
        }
    }
}