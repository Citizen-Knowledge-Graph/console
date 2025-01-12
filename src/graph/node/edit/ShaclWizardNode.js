import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, localName, runSparqlSelectQueryOnStore, runSparqlConstructQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore, expand } from "../../../utils.js"
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

                const buildSelectElement = (predicate, objectValue) => {
                    let select = document.createElement("select")
                    select.style.width = "40px"
                    // these are not all for now
                    let options = [
                        { value: "hasValue", label: "&equals;" },
                        { value: "minExclusive", label: "&lt;" },
                        { value: "minInclusive", label: "&le;" },
                        { value: "maxExclusive", label: "&gt;" },
                        { value: "maxInclusive", label: "&ge;" },
                    ]
                    if (localName(predicate) === "valueShape") {
                        options = [
                            { value: "valueShape", label: "&rarr;" }
                        ]
                        select.disabled = true
                    }
                    for (let option of options) {
                        let optionEl = document.createElement("option")
                        optionEl.value = option.value
                        optionEl.innerHTML = option.label
                        optionEl.selected = option.value === localName(predicate)
                        select.appendChild(optionEl)
                    }
                    return select
                }

                let skipList = [ expand("sh", "path"), expand("sh", "minCount") ]
                for (let property of Object.keys(properties)) {
                    if (skipList.includes(property)) continue
                    let select = buildSelectElement(property, properties[property])
                    tr = document.createElement("tr")
                    tr.appendChild(document.createElement("td"))
                    tr.appendChild(document.createElement("td"))
                    td = document.createElement("td")
                    td.style.width = "40px"
                    td.appendChild(select)
                    tr.appendChild(td)

                    let input = document.createElement("input")
                    if (localName(property) === "valueShape") {
                        input.value = localName(properties[property]).replace("Shape", "")
                        input.disabled = true
                    } else {
                        input.value = properties[property]
                    }
                    td = document.createElement("td")
                    td.appendChild(input)
                    tr.appendChild(td)
                    table.appendChild(tr)
                }

                if (Object.keys(properties).includes(expand("sh", "valueShape"))) continue
                let btn = buildAddBtn(`+ add new constraint to '${datafieldObj.name}'`, "small", async () => {
                    tr = document.createElement("tr")
                    tr.appendChild(document.createElement("td"))
                    tr.appendChild(document.createElement("td"))
                    td = document.createElement("td")
                    td.colSpan = 2
                    td.textContent = "TODO"
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

            let btn = buildAddBtn(`+ add new property to '${localName(targetClass)}'`, "normal", async () => {
                tr = document.createElement("tr")
                tr.appendChild(document.createElement("td"))
                td = document.createElement("td")
                td.colSpan = 3
                td.textContent = "TODO"
                tr.appendChild(td)
                rowToInsertBefore.parentNode.insertBefore(tr, rowToInsertBefore)
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

        let btn = buildAddBtn("+ add another class", "large",async () => {
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
            tr.appendChild(td)
            rowToInsertBefore.parentNode.insertBefore(tr, rowToInsertBefore)
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
            // input.addEventListener("focus", () => awesomplete.open())
            input.addEventListener("blur", () => tr.remove())
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
        tr = document.createElement("tr")
        let rowToInsertBefore = tr
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
