import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, localName, runSparqlSelectQueryOnStore, runSparqlConstructQueryOnStore, serializeStoreToTurtle, shrink, runSparqlInsertDeleteQueryOnStore } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclWizardNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = null
        this.currentInput = null
    }

    getMainHtml() {
        return `<div class="shacl-wizard-container" style="margin: 0 0 20px 10px">TODO</div>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["Datafield definitions and existing SHACL shapes"])
        this.assignTitlesToPorts("output", ["Output", "Internal state"])
        let container = this.nodeDiv.querySelector(".shacl-wizard-container")
        container.style.cursor = "default"
        container.addEventListener("mousedown", event => event.stopPropagation())
    }

    enoughIncomingDataAvailable() {
        return this.hasAsMuchIncomingDataAvailableAsIncomingEdges()
    }

    async serializeOutput() {
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                ?nodeShape a sh:NodeShape ;
                    sh:targetClass ?targetClass ;
                    sh:property ?classDatafieldPropertyShape .
                ?classDatafieldPropertyShape ?p ?o .
            } WHERE {
                ?nodeShape a sh:NodeShape ;
                    sh:targetClass ?targetClass ;
                    sh:property ?propertyShape .
                ?propertyShape sh:path ?datafield ;
                    ?p ?o .
                BIND(IRI(CONCAT(STR(?nodeShape), "_", REPLACE(STR(?datafield), "^.*[#/]", ""), "PropShape")) AS ?classDatafieldPropertyShape)
            }`
        let constructedQuads = await runSparqlConstructQueryOnStore(query, this.store)
        let store = new Store()
        for (let quad of constructedQuads) store.addQuad(quad)
        return await serializeStoreToTurtle(store) // ensure pretty blank node serialization TODO
    }

    async update() {
        let outgoingEdges = Object.values(this.graph.edgesMap).filter(edge => edge.sourceNode === this)
        let edge = outgoingEdges.find(edge => edge.portOut === "output_1")
        if (edge) edge.targetNode.justShowValue(await this.serializeOutput(), "turtle")
        edge = outgoingEdges.find(edge => edge.portOut === "output_2")
        if (edge) edge.targetNode.justShowValue(await serializeStoreToTurtle(this.store), "turtle")
    }

    async processIncomingData() {
        let input = this.incomingData[0].data
        if (input !== this.currentInput) {
            this.currentInput = input
            this.store = new Store()
            await addRdfStringToStore(input, this.store)
            await this.rebuildForm()
        }
        return ""
    }

    async rebuildForm() {
        let container = this.nodeDiv.querySelector(".shacl-wizard-container")
        while (container.firstChild) container.firstChild.remove()

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
            query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                SELECT * WHERE { ?class a ff:Class . }`
            let classes = (await runSparqlSelectQueryOnStore(query, this.store)).map(row => {
                return { value: row.class, label: shrink(row.class) }
            })
            let input = document.createElement("input")
            container.appendChild(input)
            new Awesomplete(input, {
                minChars: 0,
                list: classes,
                replace: (suggestion) => {
                    input.value = suggestion.label
                }
            })
            input.addEventListener("awesomplete-selectcomplete", async (obj) => {
                // TODO
            })
        })

        await this.update()
    }

    // can this be moved to Node and be a fallback there? check for unforeseen consequences
    getValue() { return "" }
    setValue(value) {}
}
