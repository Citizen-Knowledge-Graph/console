import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, expand, localName, runSparqlSelectQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore, runSparqlConstructQueryOnStore, formatObject, runValidationOnStore, serializeDatasetToTurtle, datasetToStore, stripQuotes } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = null // internal state
        this.inputTurtles = {}
        this.materializationRules = {}
        this.elementsMap = {} // DOM elements that will be shown red in case of validation errors
        this.evalSubjectSpecific = false
    }

    getMainHtml() {
        return `<div class="shacl-form-container" style="margin: 0 0 20px 10px"/>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["Datafield definitions", "Requirement profile(s)", "Existing profile"])
        this.assignTitlesToPorts("output", ["Profile", "Internal state", "Validation result: plausibility", "Validation result: subject-specific"])
        let container = this.nodeDiv.querySelector(".shacl-form-container")
        container.style.cursor = "default"
        container.addEventListener("mousedown", event => event.stopPropagation())
    }

    async serializeOutput() {
        let stateStoreWithDfs = new Store()
        this.store.getQuads().forEach(quad => stateStoreWithDfs.addQuad(quad))
        await addRdfStringToStore(this.inputTurtles.dfs, stateStoreWithDfs) // to include the ff:MapOfConstants

        let outputStore = new Store()

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                ?individual ?p ?o .
            } WHERE {
                ?individual a ?class ;
                    ?p ?o .
                ?class a ff:Class .
            }`
        let constructedQuads = await runSparqlConstructQueryOnStore(query, stateStoreWithDfs)
        for (let quad of constructedQuads) outputStore.addQuad(quad)

        for (let [rule, query] of Object.entries(this.materializationRules)) {
            constructedQuads = await runSparqlConstructQueryOnStore(query, stateStoreWithDfs)
            for (let quad of constructedQuads) {
                let individual = quad.subject.id ?? quad.subject.value
                let path = quad.predicate.id ?? quad.predicate.value
                let obj = quad.object.id ?? quad.object.value
                let element = this.elementsMap[`${individual}-${path}`]
                if (!element) continue
                element.input.value = stripQuotes(obj)
                outputStore.addQuad(quad)
            }
            // tag those quads with the applied rule via rdf-star TODO
        }

        return await serializeStoreToTurtle(outputStore)
    }

    async update() {
        this.inputTurtles.currentUp = await this.serializeOutput()
        this.sendInstantShowValue("output_1", this.inputTurtles.currentUp)
        this.sendInstantShowValue("output_2", await serializeStoreToTurtle(this.store))
        let result = await runValidationOnStore(this.store) // could be just plausibility, or also subject-specific if checkbox is set
        this.sendInstantShowValue("output_3", await serializeDatasetToTurtle(result.dataset))
        let store = new Store()
        await addRdfStringToStore(this.inputTurtles.rp, store)
        await addRdfStringToStore(this.inputTurtles.currentUp, store)
        let subjectSpecificResult = await runValidationOnStore(store)
        this.sendInstantShowValue("output_4", await serializeDatasetToTurtle(subjectSpecificResult.dataset))
        await this.highlightErrors(result)
    }

    async highlightErrors(validationResult) {
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
        let rows = await runSparqlSelectQueryOnStore(query, datasetToStore(validationResult.dataset))
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
        let dfs = this.incomingData[0].data
        let rp = this.incomingData[1].data
        let up = this.incomingData[2].data
        if (this.inputTurtles.dfs !== dfs || this.inputTurtles.rp !== rp || this.inputTurtles.up !== up) {
            this.inputTurtles = { dfs, rp, up, currentUp: up }
            await this.rebuildInternalState()
        }
        return ""
    }

    async rebuildInternalState() {
        let inputStore = new Store()
        await addRdfStringToStore(this.inputTurtles.dfs, inputStore)
        await addRdfStringToStore(this.inputTurtles.rp, inputStore)
        await addRdfStringToStore(this.inputTurtles.currentUp, inputStore)

        // multiply out the individuals: create the internal form state
        this.store = new Store()

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                # multiply out form fields
                ?individualNodeShape a sh:NodeShape ;
                    sh:targetNode ?individual ;
                    ff:hasParent ?parentIndividual ;
                    ff:instanceOf ?class ;
                    sh:property ?individualDatafieldPropertyShape .
                ?individualDatafieldPropertyShape ?dfP ?dfO ;
                    sh:order ?order .
                # optionally also include requirement profile constraints
                ${this.evalSubjectSpecific ? "?individualDatafieldPropertyShape ?rpP ?rpO ." : ""}
                #<< ?individualDatafieldPropertyShape ?rpP ?rpO >> ff:viaRequirementProfile ?reqProf .
            
                # add user profile
                ?individual ?upP ?upO .
              
                # add requirement profile metadata
                ?reqProf ?rpMetaP ?rpMetaO .
            } WHERE {
                # from user profile
                ?individual a ?class ;
                    ?upP ?upO .
                ?class a ff:Class .
                BIND(IRI(CONCAT(STR(?individual), "_NodeShape")) AS ?individualNodeShape)
              
                OPTIONAL {
                    ?parentIndividual a ?otherClass .
                    ?otherClass a ff:Class .
                    ?parentIndividual ?predicate ?individual .
                }
              
                # from requirement profile
                ?reqProf a ff:RequirementProfile ;
                      ?rpMetaP ?rpMetaO .         
                ?classNodeShape sh:targetClass ?class ;
                    sh:property ?classNodeShapeProperty .
                ?classNodeShapeProperty sh:path ?datafield ;
                    ?rpP ?rpO .
                FILTER(?rpP != sh:path)
                OPTIONAL { ?classNodeShapeProperty sh:order ?order }
            
                # from datafields.ttl
                ?datafield a ff:DataField ;
                    ff:shaclShape ?datafieldPropertyShape .
                ?datafieldPropertyShape ?dfP ?dfO .
              
                FILTER(?dfP != sh:in)
            
                BIND(IRI(CONCAT(STR(?individual), "_", REPLACE(STR(?datafield), "^.*[#/]", ""), "PropShape")) AS ?individualDatafieldPropertyShape)
            }`
        let constructedQuads = await runSparqlConstructQueryOnStore(query, inputStore)
        for (let quad of constructedQuads) this.store.addQuad(quad)

        // separate query for lists and AnswerOptions
        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            CONSTRUCT {
                ?individualDatafieldPropertyShape sh:in ?rootList .
                ?listNode rdf:first ?head ;
                    rdf:rest  ?tail .
                ?ao ?aoP ?aoO .
            } WHERE {
                ?individual a ?class .
                ?class a ff:Class .
                ?classNodeShape sh:targetClass ?class ;
                    sh:property ?classNodeShapeProperty .
                ?classNodeShapeProperty sh:path ?datafield .
                
                ?datafield a ff:DataField ;
                    ff:shaclShape ?datafieldPropertyShape .
            
                BIND(IRI(CONCAT(STR(?individual), "_", REPLACE(STR(?datafield), "^.*[#/]", ""), "PropShape")) AS ?individualDatafieldPropertyShape)
            
                ?datafieldPropertyShape sh:in ?rootList .
                ?rootList rdf:rest* ?listNode .
                ?listNode rdf:first ?head ;
                    rdf:rest  ?tail .
            
                ?ao a ff:AnswerOption ;
                    ?aoP ?aoO .
            }`
        constructedQuads = await runSparqlConstructQueryOnStore(query, inputStore)
        for (let quad of constructedQuads) this.store.addQuad(quad)

        // materialization rules
        this.materializationRules = {}
        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT * WHERE {
                ?rule a ff:MaterializationRule ;
                    ff:sparqlConstructQuery ?query .
            }`
        let rows = await runSparqlSelectQueryOnStore(query, inputStore)
        for (let row of rows) this.materializationRules[row.rule] = row.query.trim() // throw them in the internal state store instead?

        await this.rebuildForm()
    }

    async rebuildForm() {
        let container = this.nodeDiv.querySelector(".shacl-form-container")
        while (container.firstChild) container.firstChild.remove()

        let div = document.createElement("div")
        div.style.float = "right"
        let label = document.createElement("label")
        label.textContent = "Evaluate subject-specific constraints:"
        label.style = "font-size: x-small; color: gray"
        div.appendChild(label)
        let checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.checked = this.evalSubjectSpecific
        checkbox.style = "width: 12px; height: 12px"
        checkbox.addEventListener("change", async event => {
            this.evalSubjectSpecific = !this.evalSubjectSpecific
            await this.rebuildInternalState()
        })
        div.appendChild(checkbox)
        container.appendChild(div)
        container.appendChild(document.createElement("br"))

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
                    this.inputTurtles.currentUp = await this.serializeOutput()
                    await this.rebuildInternalState()
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
                        this.inputTurtles.currentUp = await this.serializeOutput()
                        await this.rebuildInternalState()

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
                    // related materialized triples might also have to get deleted TODO
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

        if (!this.evalSubjectSpecific) {
            container.appendChild(document.createElement("br"))
            let btn = document.createElement("input")
            btn.type = "button"
            btn.value = "Submit"
            btn.addEventListener("click", async () => {
                let store = new Store()
                await addRdfStringToStore(this.inputTurtles.rp, store)
                await addRdfStringToStore(this.inputTurtles.currentUp, store)
                let result = await runValidationOnStore(store)
                await this.highlightErrors(result)
            })
            container.appendChild(btn)
        }

        this.rerenderConnectingEdges()
        await this.update()
    }

    getValue() { return "" }
    setValue(value) {}
}
