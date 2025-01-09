import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, runSparqlSelectQueryOnStore } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclWizardNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
        this.store = null
    }

    getMainHtml() {
        return `<div class="shacl-wizard-container">TODO</div>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["datafield definitions"])
        this.assignTitlesToPorts("output", ["SHACL shapes"])
        let container = this.nodeDiv.querySelector(".shacl-wizard-container")
        container.style.cursor = "default"
        container.addEventListener("mousedown", event => event.stopPropagation())
    }

    enoughIncomingDataAvailable() {
        return this.hasAsMuchIncomingDataAvailableAsIncomingEdges()
    }

    async processIncomingData() {
        let container = this.nodeDiv.querySelector(".shacl-wizard-container")
        while (container.firstChild) container.firstChild.remove()
        this.store = new Store()
        let input = this.incomingData[0].data
        await addRdfStringToStore(input, this.store)

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?nodeShape a sh:NodeShape ;
                    sh:targetClass ?class .
            }`
        let rows = await runSparqlSelectQueryOnStore(query, this.store)
        for (let row of rows) {
            // TODO
        }
        return null
    }

    // can this be moved to Node and be a fallback there? check for unforeseen consequences
    getValue() { return "" }
    setValue(value) {}
}
