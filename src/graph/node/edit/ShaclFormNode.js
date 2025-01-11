import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, expand, localName, runSparqlSelectQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore, runSparqlConstructQueryOnStore, formatObject, runValidationOnStore, serializeDatasetToTurtle, datasetToStore } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = null
        this.currentShacl = ""
        this.elementsMap = {} // DOM elements that will be shown red in case of validation errors
    }

    getMainHtml() {
        return `<div class="shacl-form-container" style="margin: 0 0 20px 10px"/>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("output", ["Form output", "Internal form state", "Validation result"])
        let container = this.nodeDiv.querySelector(".shacl-form-container")
        container.style.cursor = "default"
        container.addEventListener("mousedown", event => event.stopPropagation())
    }

    async serializeOutput() {
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                ?individual ?p ?o .
            } WHERE {
                ?individual a ?class .
                FILTER(?class NOT IN (sh:NodeShape, sh:PropertyShape, ff:RequirementProfile, ff:AnswerOption))
                ?individual ?p ?o .
            }`
        let constructedQuads = await runSparqlConstructQueryOnStore(query, this.store)
        let store = new Store()
        for (let quad of constructedQuads) store.addQuad(quad)
        return await serializeStoreToTurtle(store)
    }

    async update() {
        let result = await runValidationOnStore(this.store)
        this.sendInstantShowValue("output_1", await this.serializeOutput())
        this.sendInstantShowValue("output_2", await serializeStoreToTurtle(this.store))
        this.sendInstantShowValue("output_3", await serializeDatasetToTurtle(result.dataset))

        // reset errors
        for (let element of Object.values(this.elementsMap)) {
            element.label.style.color = "black"
            element.input.style.border = ""
            element.label.title = ""
            element.input.title = ""
        }
        // set errors
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?result a sh:ValidationResult ;
                    sh:focusNode ?individual ;
                    sh:resultPath ?path ;
                    sh:sourceConstraintComponent ?constraintComponent ;
                    sh:resultMessage ?message . 
            }`
        let rows = await runSparqlSelectQueryOnStore(query, datasetToStore(result.dataset))
        for (let row of rows) {
            let element = this.elementsMap[`${row.individual}-${row.path}`]
            if (!element) continue
            element.label.style.color = "red"
            element.input.style.border = "2px solid red"
            let msg = row.message.split("^^")[0]
            element.label.title = msg
            element.input.title = msg
        }
    }

    async processIncomingData() {
        let shacl = this.incomingData[0].data
        if (shacl === this.currentShacl) return null

        let container = this.nodeDiv.querySelector(".shacl-form-container")
        while (container.firstChild) container.firstChild.remove()
        this.currentShacl = shacl
        this.store = new Store()
        await addRdfStringToStore(shacl, this.store)

        // requirement profile metadata
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT * WHERE {
                ?rp a ff:RequirementProfile ;
                    ff:title ?title .
                FILTER(LANGMATCHES(LANG(?title), "en"))
            }`
        let rows = await runSparqlSelectQueryOnStore(query, this.store)
        let title = rows.map(row => row.title).join(" & ")
        let h2 = document.createElement("h2")
        h2.textContent = title
        container.appendChild(h2)

        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?nodeShape sh:targetNode ?individual ;
                    ff:instanceOf ?individualClass .
                OPTIONAL { ?nodeShape ff:hasParent ?parentIndividual . }
            }`
        let root
        let individualsTree = {}
        rows = await runSparqlSelectQueryOnStore(query, this.store)
        for (let row of rows) {
            individualsTree[row.individual] = { class: row.individualClass, children: [], propertyShapes: [] }
            if (!row.parentIndividual) root = row.individual
        }
        for (let row of rows) {
            if (row.parentIndividual) individualsTree[row.parentIndividual].children.push(row.individual)
            query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                SELECT * WHERE {
                    ?nodeShape sh:targetNode <${row.individual}> ;
                        sh:property ?propertyShape .
                    OPTIONAL { ?propertyShape sh:order ?order . }
                }`
            let psRows = await runSparqlSelectQueryOnStore(query, this.store)
            let orderMap = {}
            let unordered = []
            for (let psRow of psRows) {
                if (psRow.order) orderMap[psRow.propertyShape] = psRow.order
                else unordered.push(psRow.propertyShape)
            }
            const sortedOrderMap = Object.fromEntries(Object.entries(orderMap).sort(([, v1], [, v2]) => Number(v1) - Number(v2)))
            individualsTree[row.individual].propertyShapes = Object.keys(sortedOrderMap).concat(unordered)
        }

        const buildFormElementsForIndividual = async (individual, propertyShapes, depth) => {
            let indentation = `${depth * 50}px`
            let name = localName(individual)
            let h3 = document.createElement("h3")
            h3.textContent = name
            h3.style.marginLeft = indentation
            if (!individual.endsWith("mainPerson")) {
                let del = document.createElement("span")
                del.innerHTML = "&#10005;"
                del.style = "font-weight: normal; color: silver; font-size: x-small; margin-left: 5px; cursor: pointer;"
                del.addEventListener("click", async () => {
                    let query = `
                        DELETE { ?s ?p ?o } WHERE {
                            ?s ?p ?o . FILTER(?s = <${individual}> || ?o = <${individual}>) 
                        }`
                    await runSparqlInsertDeleteQueryOnStore(query, this.store)
                    await this.update()
                    this.graph.run()
                })
                h3.appendChild(del)
            }
            container.appendChild(h3)

            for (let propertyShape of propertyShapes) {
                query = `
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    SELECT * WHERE {
                        <${propertyShape}> a sh:PropertyShape ;
                            ?propKey ?propValue ;
                            sh:path ?path .
                      OPTIONAL { <${individual}> ?path ?value } .
                    }`
                let properties = {};
                let results = await runSparqlSelectQueryOnStore(query, this.store)
                results.forEach(result => properties[result.propKey] = result.propValue)
                let datafieldValue = results[0].value

                let path = properties[expand("sh", "path")] // datafield
                let pointsToInstancesOf = properties[expand("ff", "pointsToInstancesOf")]

                if (pointsToInstancesOf) {
                    let btn = document.createElement("div")
                    btn.style = "margin-top: 10px; cursor: pointer; color: gray; font-size: small"
                    btn.style.marginLeft = indentation
                    btn.innerHTML = `+ ${properties[expand("sh", "description")]}`
                    btn.addEventListener("click", async () => {
                        let query = `
                            SELECT (COUNT(?existingIndividual) AS ?count) WHERE {
                                <${individual}> <${path}> ?existingIndividual .
                            }`
                        let count = (await runSparqlSelectQueryOnStore(query, this.store))[0].count
                        // this is not a stable solution, if child0 gets deleted, child1 is already there TODO
                        let newIndividual = pointsToInstancesOf.toLowerCase() + (Number(count) + 1)
                        query = `
                            INSERT DATA {
                              <${individual}> <${path}> <${newIndividual}> .
                              <${newIndividual}> a <${pointsToInstancesOf}> .
                            }`
                        await runSparqlInsertDeleteQueryOnStore(query, this.store)
                        await this.update()
                        this.graph.run() // workaround
                    })
                    container.appendChild(btn)
                    continue
                }

                let elementIdentifier = `${individual}-${path}`
                this.elementsMap[elementIdentifier] = {}

                let label = document.createElement("label")
                label.textContent = properties[expand("sh", "name")]
                label.title = path
                label.style.marginRight = "10px"
                label.style.marginLeft = indentation
                container.appendChild(label)
                this.elementsMap[elementIdentifier].label = label

                const handleChange = async (newValue) => {
                    let query = `SELECT * WHERE { <${individual}> <${path}> ?oldValue . }`
                    let valueBeforeChange = formatObject((await runSparqlSelectQueryOnStore(query, this.store))[0]?.oldValue)
                    let valueAfterChange = formatObject(newValue)
                    if (valueAfterChange) {
                        if (valueBeforeChange) {
                            query = `DELETE DATA { <${individual}> <${path}> ${valueBeforeChange} . };
                                INSERT DATA { <${individual}> <${path}> ${valueAfterChange} . }`
                        } else {
                            query = `INSERT DATA { <${individual}> <${path}> ${valueAfterChange} . }`
                        }
                    } else {
                        query = `DELETE DATA { <${individual}> <${path}> ${valueBeforeChange} . }`
                    }
                    await runSparqlInsertDeleteQueryOnStore(query, this.store)
                    await this.update()
                }

                if (properties[expand("sh", "in")]) {
                    let query = `
                        PREFIX ff: <https://foerderfunke.org/default#>
                        PREFIX sh: <http://www.w3.org/ns/shacl#>
                        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                        SELECT * WHERE {
                            <${propertyShape}> a sh:PropertyShape ;
                                sh:in ?rootList .
                            ?rootList rdf:rest* ?listNode .
                            ?listNode rdf:first ?listItem .
                            ?listItem ff:title ?title .
                        }`
                    let options = (await runSparqlSelectQueryOnStore(query, this.store)).map(result => [result.listItem, result.title])
                    let select = document.createElement("select")
                    const appendOption = (value, label, selected) => {
                        let option = document.createElement("option")
                        option.value = value
                        option.textContent = label
                        option.selected = value === datafieldValue || selected
                        select.appendChild(option)
                    }
                    appendOption("", "-", true)
                    for (let [value, label] of options) appendOption(value, label, false)
                    select.addEventListener("change", async event => await handleChange(event.target.value))
                    container.appendChild(select)
                    this.elementsMap[elementIdentifier].input = select
                    container.appendChild(document.createElement("br"))
                    container.appendChild(document.createElement("br"))
                    continue
                }

                let input = document.createElement("input")
                if (datafieldValue) input.setAttribute("value", datafieldValue)
                input.addEventListener("change", async event => await handleChange(event.target.value))
                container.appendChild(input)
                this.elementsMap[elementIdentifier].input = input
                container.appendChild(document.createElement("br"))
                container.appendChild(document.createElement("br"))
            }
        }

        const walkTreeRecursively = async (individual, depth) => {
            let individualObj = individualsTree[individual]
            await buildFormElementsForIndividual(individual, individualObj.propertyShapes, depth)
            for (let child of individualObj.children) await walkTreeRecursively(child, depth + 1)
        }
        await walkTreeRecursively(root, 0)

        await this.update()
        this.rerenderConnectingEdges()
        return null
    }

    getValue() { return "" }
    setValue(value) {}
}
