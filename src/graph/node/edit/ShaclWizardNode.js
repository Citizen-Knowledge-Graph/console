import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, localName, runSparqlSelectQueryOnStore, runSparqlConstructQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclWizardNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = null
        this.currentInput = {}
    }

    getMainHtml() {
        return `<div class="shacl-wizard-container" style="margin: 0 0 20px 10px">TODO</div>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["Datafield definitions", "Existing SHACL shapes (optional)"])
        this.assignTitlesToPorts("output", ["SHACL shapes", "Internal state"])
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
                    sh:property ?propertyShape .
                ?propertyShape ?p ?o .
            } WHERE {
                ?nodeShape a sh:NodeShape ;
                    sh:targetClass ?targetClass .
                OPTIONAL {
                    ?nodeShape sh:property ?propertyShape .
                    ?propertyShape ?p ?o .
                }
            }`
        let constructedQuads = await runSparqlConstructQueryOnStore(query, this.store)
        let store = new Store()
        for (let quad of constructedQuads) store.addQuad(quad)
        return await serializeStoreToTurtle(store)
    }

    async update() {
        this.sendInstantShowValue("output_1", await this.serializeOutput())
        this.sendInstantShowValue("output_2", await serializeStoreToTurtle(this.store))
    }

    async processIncomingData() {
        let datafields = this.incomingData[0].data
        let shacl = this.incomingData[1]?.data
        if (this.currentInput.datafields !== datafields || this.currentInput.shacl !== shacl) {
            this.currentInput = { datafields, shacl }
            this.store = new Store()
            await addRdfStringToStore(datafields, this.store)
            if (shacl) await addRdfStringToStore(shacl, this.store)
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
            let h2 = document.createElement("h2")
            h2.textContent = localName(targetClass)
            container.appendChild(h2)

            query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                SELECT ?datafield ?name WHERE {
                    <${nodeShape}> sh:property ?propertyShape .
                    ?propertyShape sh:path ?datafield .
                    ?datafield a ff:DataField ;
                        ff:shaclShape ?shaclShape .
                    ?shaclShape sh:name ?name .
                }`
            let datafields = await runSparqlSelectQueryOnStore(query, this.store)
            for (let datafieldObj of datafields) {
                query = `
                    PREFIX ff: <https://foerderfunke.org/default#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    SELECT ?p ?o WHERE {
                        <${nodeShape}> sh:property ?propertyShape .
                        ?propertyShape sh:path <${datafieldObj.datafield}> ;
                            ?p ?o .
                    }`
                let properties = {}
                let rows = await runSparqlSelectQueryOnStore(query, this.store)
                for (let row of rows) properties[row.p] = row.o

                let h4 = document.createElement("h4")
                h4.textContent = datafieldObj.name
                container.appendChild(h4)
            }

            buildAddBtn("+ add property constraint", async () => {
                // TODO
            })
        }

        container.appendChild(document.createElement("hr"))
        buildAddBtn("+ add class constraint", async () => {
            query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                SELECT * WHERE {
                    ?class a ff:Class ;
                        ff:title ?label .
                }`
            let classes = (await runSparqlSelectQueryOnStore(query, this.store)).map(row => {
                return { value: row.class, label: row.label }
            })
            let input = document.createElement("input")
            container.appendChild(input)
            const awesomplete = new Awesomplete(input, {
                minChars: 0,
                list: classes,
                replace: (suggestion) => {
                    input.value = suggestion?.label
                }
            })
            input.addEventListener("input", () => {
                if (awesomplete.suggestions && awesomplete.suggestions.length > 0) return
                let item = document.createElement("li")
                item.textContent = "+ Create new class"
                item.addEventListener("click", () => alert("TODO"))
                awesomplete.ul.appendChild(item)
                awesomplete.open()
            })
            input.addEventListener("blur", () => input.remove())
            input.addEventListener("awesomplete-selectcomplete", async (obj) => {
                if (!obj.text) return
                let targetClass = obj.text.value
                query = `
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT DATA {
                        <${targetClass}Shape> a sh:NodeShape ;
                            sh:targetClass <${targetClass}> .
                    }`
                await runSparqlInsertDeleteQueryOnStore(query, this.store)
                await this.rebuildForm()
            })
        })

        this.rerenderConnectingEdges()
        await this.update()
    }

    // can this be moved to Node and be a fallback there? check for unforeseen consequences
    getValue() { return "" }
    setValue(value) {}
}
