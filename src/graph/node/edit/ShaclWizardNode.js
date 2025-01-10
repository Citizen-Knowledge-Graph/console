import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, localName, runSparqlSelectQueryOnStore } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclWizardNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
        this.store = null
    }

    getMainHtml() {
        return `<div class="shacl-wizard-container" style="margin: 0 0 20px 10px">TODO</div>`
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

        const buildAddBtn = (text, onClick) => {
            let btn = document.createElement("div")
            btn.style = "margin-top: 10px; cursor: pointer; color: gray; font-size: small"
            btn.textContent = text
            btn.addEventListener("click", async () => onClick())
            container.appendChild(btn)
        }

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?nodeShape a sh:NodeShape ;
                    sh:targetClass ?targetClass .
            }`
        for (let [targetClass, nodeShape] of (await runSparqlSelectQueryOnStore(query, this.store)).map(row => [row.targetClass, row.nodeShape])) {
            let h3 = document.createElement("h3")
            h3.textContent = localName(targetClass)
            container.appendChild(h3)

            query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                SELECT * WHERE {
                    <${nodeShape}> sh:property ?propertyShape .
                    ?propertyShape ?p ?o .
                }`
            let properties = {};
            let rows = await runSparqlSelectQueryOnStore(query, this.store)
            rows.forEach(result => properties[result.p] = result.o)

            buildAddBtn("+ add property constraint", async () => {
                // TODO
            })
        }

        container.appendChild(document.createElement("hr"))
        buildAddBtn("+ add class constraint", async () => {
            // TODO
        })

        return null
    }

    // can this be moved to Node and be a fallback there? check for unforeseen consequences
    getValue() { return "" }
    setValue(value) {}
}
