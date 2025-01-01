import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { runSparqlSelectQueryOnRdfString } from "../../../utils.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
        this.value = ""
    }

    getMainHtml() {
        return `<div class="shacl-form-container"/>`
    }

    async processIncomingData() {
        let container = this.nodeDiv.querySelector(".shacl-form-container")
        while (container.firstChild) container.firstChild.remove()

        let shacl = this.incomingData[0].data
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?shape sh:targetNode ?targetNode ;
                    sh:property ?property .
                ?property ?p ?o .
            }`
        let rows = await runSparqlSelectQueryOnRdfString(query, shacl)
        let datafields = {}
        for (let row of rows) {
            if (!datafields[row.targetNode]) datafields[row.targetNode] = {}
            let targetNode = datafields[row.targetNode]
            if (!targetNode[row.property]) targetNode[row.property] = {}
            let property = targetNode[row.property]
            property[row.p] = row.o
        }
        console.log(datafields)
        // TODO
        return "dev"
    }

    getValue() {
        return this.value
    }

    setValue(value) {
        this.value = value
    }
}
