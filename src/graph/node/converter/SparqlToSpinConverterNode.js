import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class SparqlToSpinConverterNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.SPARQL ], [ PORT.TURTLE ], TYPE.CONVERTER)
    }

    async processIncomingData() {
        let sparql = this.incomingData[0].data
        async function convert(sparql) {
            const url = new URL("http://localhost:8080/sparqlToSpin")
            url.searchParams.set("sparql", sparql)
            const res = await fetch(url, { headers: { "Accept": "text/turtle" } })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return await res.text()
        }
        return await convert(sparql)
    }
}
