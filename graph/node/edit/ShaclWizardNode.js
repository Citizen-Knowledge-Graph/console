import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, localName, runSparqlSelectQueryOnStore, runSparqlConstructQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore, expand, formatObject } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclWizardNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = null
        this.currentInput = {}
    }

    getMainHtml() {
        return `<div class="shacl-wizard-container" style="margin: 0 0 20px 10px"></div>`
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
                ?rpId ?rpP ?rpO .
            } WHERE {
                ?nodeShape a sh:NodeShape ;
                    sh:targetClass ?targetClass .
                OPTIONAL {
                    ?nodeShape sh:property ?propertyShape .
                    ?propertyShape ?p ?o .
                }
                ?rpId a ff:RequirementProfile ;
                    ?rpP ?rpO .
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

    buildSelectElement = (predicate) => {
        let select = document.createElement("select")
        select.style.width = "40px"
        // these are not all for now
        let options = [
            { value: expand("sh", "hasValue"), label: "&equals;" },
            { value: expand("sh", "minExclusive"), label: "&gt;" },
            { value: expand("sh", "minInclusive"), label: "&ge;" },
            { value: expand("sh", "maxExclusive"), label: "&lt;" },
            { value: expand("sh", "maxInclusive"), label: "&le;" },
        ]
        if (predicate === expand("sh", "valueShape")) {
            options = [
                { value: expand("sh", "valueShape"), label: "&rarr;" }
            ]
            select.disabled = true
        }
        for (let option of options) {
            let optionEl = document.createElement("option")
            optionEl.value = option.value
            optionEl.innerHTML = option.label
            optionEl.selected = option.value === predicate
            select.appendChild(optionEl)
        }
        return select
    }

    buildInputElement = (buildQuery) => {
        let input = document.createElement("input")
        let inputChanged = false
        const applyValue = async () => {
            if (!inputChanged) return
            inputChanged = false
            await runSparqlInsertDeleteQueryOnStore(buildQuery(input.value), this.store)
            await this.rebuildForm()
        }
        input.addEventListener("input", () => inputChanged = true)
        input.addEventListener("blur", async () => await applyValue())
        input.addEventListener("keyup", async (event) => {
            if (event.key === "Enter") await applyValue()
        })
        return input
    }

    wireUpAutocompleteElement = (input, list, fallbackItemText, buildQuery) => {
        const awesomplete = new Awesomplete(input, {
            minChars: 0,
            list: list,
            replace: (suggestion) => {
                input.value = suggestion?.label
            }
        })
        input.addEventListener("input", () => {
            if (awesomplete.suggestions && awesomplete.suggestions.length > 0) return
            let item = document.createElement("li")
            item.textContent = fallbackItemText
            item.addEventListener("click", () => alert("TODO"))
            awesomplete.ul.appendChild(item)
            awesomplete.open()
        })
        // input.addEventListener("focus", () => awesomplete.open())
        input.addEventListener("blur", async () => await this.rebuildForm())
        input.addEventListener("awesomplete-selectcomplete", async (obj) => {
            if (!obj.text) return
            await runSparqlInsertDeleteQueryOnStore(buildQuery(obj.text.value), this.store)
            await this.rebuildForm()
        })
        return input
    }

    async rebuildForm() {
        let container = this.nodeDiv.querySelector(".shacl-wizard-container")
        while (container.firstChild) container.firstChild.remove()

        let table = document.createElement("table")
        table.classList.add("form-table")
        let tr, td

        const buildAddBtn = (text, fontSize, onClick) => {
            let btn = document.createElement("div")
            btn.style = `cursor: pointer; color: gray; font-size: ${fontSize}`
            btn.textContent = text
            btn.addEventListener("click", async () => onClick())
            return btn
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
            tr = document.createElement("tr")
            td = document.createElement("td")
            td.colSpan = 4
            td.appendChild(h2)
            tr.appendChild(td)
            table.appendChild(tr)

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
                let path = datafieldObj.datafield
                query = `
                    PREFIX ff: <https://foerderfunke.org/default#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    SELECT ?p ?o WHERE {
                        <${nodeShape}> sh:property ?propertyShape .
                        ?propertyShape sh:path <${path}> ;
                            ?p ?o .
                    }`
                let properties = {}
                let rows = await runSparqlSelectQueryOnStore(query, this.store)
                for (let row of rows) properties[row.p] = row.o

                let div = document.createElement("div")
                div.textContent = datafieldObj.name
                div.style = "font-size: large"
                tr = document.createElement("tr")
                tr.appendChild(document.createElement("td"))
                td = document.createElement("td")
                td.colSpan = 3
                td.appendChild(div)
                tr.appendChild(td)
                table.appendChild(tr)

                let skipList = [ expand("sh", "path"), expand("sh", "minCount") ]
                for (let predicate of Object.keys(properties)) {
                    if (skipList.includes(predicate)) continue
                    let object = properties[predicate]
                    let select = this.buildSelectElement(predicate)
                    select.addEventListener("change", async () => {
                        query = `
                            PREFIX sh: <http://www.w3.org/ns/shacl#>
                            DELETE {
                                ?propertyShape <${predicate}> ${formatObject(object)} .
                            } INSERT {
                                ?propertyShape <${select.value}> ${formatObject(object)} .
                            } WHERE { 
                                <${nodeShape}> sh:property ?propertyShape .
                                ?propertyShape sh:path <${path}> .
                            }`
                        await runSparqlInsertDeleteQueryOnStore(query, this.store)
                        await this.rebuildForm()
                    })
                    tr = document.createElement("tr")
                    tr.appendChild(document.createElement("td"))
                    tr.appendChild(document.createElement("td"))
                    td = document.createElement("td")
                    td.style.width = "40px"
                    td.appendChild(select)
                    tr.appendChild(td)
                    let input = this.buildInputElement((inputValue) => {
                        return `
                            PREFIX sh: <http://www.w3.org/ns/shacl#>
                            DELETE {
                                ?propertyShape <${predicate}> ?value .
                            } INSERT {
                                ?propertyShape <${predicate}> ${formatObject(inputValue)} .
                            } WHERE { 
                                <${nodeShape}> sh:property ?propertyShape .
                                ?propertyShape sh:path <${path}> ;
                                    <${predicate}> ?value .
                            }`
                    })
                    if (predicate === expand("sh", "valueShape")) {
                        input.value = localName(object).replace("Shape", "")
                        input.disabled = true
                    } else {
                        input.value = object
                    }
                    td = document.createElement("td")
                    td.appendChild(input)
                    tr.appendChild(td)
                    table.appendChild(tr)
                }

                if (Object.keys(properties).includes(expand("sh", "valueShape"))) continue
                let btn = buildAddBtn("+ add new constraint", "small", async () => {
                    tr = document.createElement("tr")
                    tr.appendChild(document.createElement("td"))
                    tr.appendChild(document.createElement("td"))
                    td = document.createElement("td")
                    let select = this.buildSelectElement()
                    td.appendChild(select)
                    tr.appendChild(td)
                    td = document.createElement("td")
                    let input = this.buildInputElement((inputValue) => {
                        return `
                            PREFIX sh: <http://www.w3.org/ns/shacl#>
                            INSERT {
                                ?propertyShape <${select.value}> ${formatObject(inputValue)} .
                            } WHERE { 
                                <${nodeShape}> sh:property ?propertyShape .
                                ?propertyShape sh:path <${path}> .
                            }`
                    })
                    td.appendChild(input)
                    tr.appendChild(td)
                    rowToInsertBefore.parentNode.insertBefore(tr, rowToInsertBefore)
                })
                tr = document.createElement("tr")
                let rowToInsertBefore = tr
                tr.appendChild(document.createElement("td"))
                tr.appendChild(document.createElement("td"))
                td = document.createElement("td")
                td.colSpan = 2
                td.appendChild(btn)
                tr.appendChild(td)
                table.appendChild(tr)
            }

            let btn = buildAddBtn("+ add new property", "normal", async () => {
                tr = document.createElement("tr")
                tr.appendChild(document.createElement("td"))
                td = document.createElement("td")
                td.colSpan = 3
                query = `
                    PREFIX ff: <https://foerderfunke.org/default#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    SELECT ?datafield ?name ?pointsToInstancesOf WHERE {
                        ?datafield a ff:DataField ;
                            ff:shaclShape ?shaclShape .
                        ?shaclShape sh:name ?name .
                        OPTIONAL { ?shaclShape ff:pointsToInstancesOf ?pointsToInstancesOf . }
                    }`
                let valueToPointsToInstancesOf = {}
                let list = (await runSparqlSelectQueryOnStore(query, this.store)).map(row => {
                    if (row.pointsToInstancesOf) valueToPointsToInstancesOf[row.datafield] = row.pointsToInstancesOf
                    return { value: row.datafield, label: row.name }
                })
                let input = document.createElement("input")
                td.appendChild(input)
                this.wireUpAutocompleteElement(input, list, "+ create new property", (datafield) => {
                    return `
                        PREFIX sh: <http://www.w3.org/ns/shacl#>
                        INSERT DATA {
                            <${nodeShape}> sh:property [
                                sh:path <${datafield}> ;
                                sh:minCount 1 ;
                                ${valueToPointsToInstancesOf[datafield] ? `sh:valueShape <${valueToPointsToInstancesOf[datafield]}Shape> ;` : ""}
                            ] .
                        }`
                })
                tr.appendChild(td)
                rowToInsertBefore.parentNode.insertBefore(tr, rowToInsertBefore)
                rowToInsertBefore.remove()
            })
            tr = document.createElement("tr")
            let rowToInsertBefore = tr
            tr.appendChild(document.createElement("td"))
            td = document.createElement("td")
            td.colSpan = 3
            btn.style.marginTop = "8px"
            td.appendChild(btn)
            tr.appendChild(td)
            table.appendChild(tr)
        }

        let btn = buildAddBtn("+ add new class", "large",async () => {
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
            tr = document.createElement("tr")
            td = document.createElement("td")
            td.colSpan = 4
            td.appendChild(input)
            this.wireUpAutocompleteElement(input, classes, "+ create new class", (targetClass) => {
                return `
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT DATA {
                        <${targetClass}Shape> a sh:NodeShape ;
                            sh:targetClass <${targetClass}> .
                    }`
            })
            tr.appendChild(td)
            btnRow.remove()
            table.appendChild(tr)
        })
        tr = document.createElement("tr")
        let btnRow = tr
        td = document.createElement("td")
        td.colSpan = 4
        td.appendChild(btn)
        tr.appendChild(td)
        table.appendChild(tr)

        container.appendChild(table)
        this.rerenderConnectingEdges()
        await this.update()
    }

    // can this be moved to Node and be a fallback there? check for unforeseen consequences
    getValue() { return "" }
    setValue(value) {}
}
