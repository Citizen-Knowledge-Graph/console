import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, datasetToStore, formatObject, localName, runSparqlConstructQueryOnStore, runSparqlInsertDeleteQueryOnStore, runSparqlSelectQueryOnStore, runValidationOnStore, serializeStoreToTurtle, expand } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclQuizFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE, PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.inputTurtles = {}
    }

    getMainHtml() {
        return `<div class="shacl-quiz-form-container" style="margin: 0 0 20px 10px"/>`
    }

    addInputPort() {
        super.addInputPortOfType(PORT.TURTLE)
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["Datafield definitions", "Existing user profile", "Requirement profile"])
        this.assignTitlesToPorts("output", ["Profile", "Validation result(s)", "Priority list", "Eligibility status", "Missing data output", "Violations output"])
        let container = this.nodeDiv.querySelector(".shacl-quiz-form-container")
        container.style.cursor = "default"
        container.addEventListener("mousedown", event => event.stopPropagation())
    }

    async processIncomingData() {
        // ensure a reliable order of incoming data, major TODO
        let dfs = this.incomingData[0].data
        let up = this.incomingData[1].data
        let rps = [ this.incomingData[2].data ]
        for (let i = 3; i < this.inputs.length; i++) {
            rps.push(this.incomingData[i].data)
        }
        // leaving out the diff check for now, add it back in TODO
        this.inputTurtles = { dfs, up, currentUp: up, rps }
        await this.rebuild()
        return ""
    }

    async rebuild() {
        let container = this.nodeDiv.querySelector(".shacl-quiz-form-container")
        while (container.firstChild) container.firstChild.remove()

        this.sendInstantShowValue("output_1", this.inputTurtles.currentUp)

        let processedValidationsStore = new Store()
        for (let rp of this.inputTurtles.rps) {
            let valiStore = new Store()
            await addRdfStringToStore(this.inputTurtles.currentUp, valiStore)
            await addRdfStringToStore(rp, valiStore)
            let query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                SELECT * WHERE { ?rp a ff:RequirementProfile . }`
            let rpUri = (await runSparqlSelectQueryOnStore(query, valiStore))[0].rp

            let result = await runValidationOnStore(valiStore)
            let resultStore = datasetToStore(result.dataset)

            query = `
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                PREFIX ff: <https://foerderfunke.org/default#>
                DELETE {
                    # delete redundant constraint in special case
                    ?valiRep sh:result ?hasValueValiRes .
                    ?hasValueValiRes ?p ?o .
                } INSERT {
                    # inject connection to rp
                    ?valiRep ff:wasProducedFor <${rpUri}> .
                } WHERE {
                    ?valiRep a sh:ValidationReport .
                    OPTIONAL {
                      ?minCountValiRes a sh:ValidationResult ;
                          sh:sourceConstraintComponent sh:MinCountConstraintComponent ;
                          sh:focusNode ?focus ;
                          sh:sourceShape ?shape ;
                          sh:resultPath ?path .
                      ?hasValueValiRes a sh:ValidationResult ;
                          sh:sourceConstraintComponent sh:HasValueConstraintComponent ;
                          sh:focusNode ?focus ;
                          sh:sourceShape ?shape ;
                          sh:resultPath ?path .
                      ?valiRep sh:result ?hasValueValiRes .
                      ?hasValueValiRes ?p ?o .
                    }
                }`
            await runSparqlInsertDeleteQueryOnStore(query, resultStore)
            processedValidationsStore.addQuads(resultStore.getQuads())
        }
        this.sendInstantShowValue("output_2", await serializeStoreToTurtle(processedValidationsStore))

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                ?rp ff:hasEligibilityStatus ?status .
            } WHERE {
                ?report ff:wasProducedFor ?rp ;
                    sh:conforms ?conforms .
                BIND(
                    IF(
                        ?conforms = true,
                        ff:eligible,
                        IF(
                            EXISTS {
                                ?report sh:result ?result .
                                ?result sh:sourceConstraintComponent ?type .
                                FILTER(?type NOT IN (
                                    sh:MinCountConstraintComponent,
                                    sh:QualifiedMinCountConstraintComponent
                                ))
                            },
                        ff:ineligible,
                        ff:missingData
                        )
                    ) AS ?status
                )
            }`
        let eligibilityStore = new Store()
        let constructedQuads = await runSparqlConstructQueryOnStore(query, processedValidationsStore)
        for (let quad of constructedQuads) eligibilityStore.addQuad(quad)
        this.sendInstantShowValue("output_4", await serializeStoreToTurtle(eligibilityStore))

        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                ?dfId ff:isMissedBy ?rp ;
                    ff:hasSub ?subject ;
                    ff:hasPred ?predicate .
            } WHERE {
                VALUES ?allowedConstraint {
                    sh:MinCountConstraintComponent
                    sh:QualifiedMinCountConstraintComponent
                }
                ?report ff:wasProducedFor ?rp ;
                    sh:result ?result .
                ?result a sh:ValidationResult ;
                    sh:sourceConstraintComponent ?type ;
                    sh:focusNode ?subject ;
                    sh:resultPath ?predicate .
                FILTER(?type IN (?allowedConstraint))
                FILTER NOT EXISTS {
                    ?report sh:result ?otherResult .
                    ?otherResult sh:sourceConstraintComponent ?otherType .
                    FILTER(?otherType NOT IN (?allowedConstraint))
                }
                BIND(IRI(CONCAT(STR(?subject), "_", REPLACE(STR(?predicate), "^.*[#/]", ""))) AS ?dfId)
            }`
        let missingDataStore = new Store()
        constructedQuads = await runSparqlConstructQueryOnStore(query, processedValidationsStore)
        for (let quad of constructedQuads) missingDataStore.addQuad(quad)
        this.sendInstantShowValue("output_5", await serializeStoreToTurtle(missingDataStore))

        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                ?rp ff:hasViolatingDatafield [
                    ff:hasSub ?subject ;
                    ff:hasPred ?predicate ;
                    ff:violationType ?type ;
                    ff:message ?message ;
                    ff:badValue ?badValue ;
                ] .
            } WHERE {
                ?report ff:wasProducedFor ?rp ;
                    sh:result ?result .
                ?result a sh:ValidationResult ;
                    sh:sourceConstraintComponent ?type ;
                    sh:focusNode ?subject ;
                    sh:resultPath ?predicate ;
                OPTIONAL { ?result sh:resultMessage ?message . }
                OPTIONAL { ?result sh:value ?badValue . }
                FILTER(
                    ?type != sh:MinCountConstraintComponent 
                    && ?type != sh:QualifiedMinCountConstraintComponent
                )
            }`
        let violationsStore = new Store()
        constructedQuads = await runSparqlConstructQueryOnStore(query, processedValidationsStore)
        for (let quad of constructedQuads) violationsStore.addQuad(quad)
        this.sendInstantShowValue("output_6", await serializeStoreToTurtle(violationsStore))

        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            CONSTRUCT {
                ?dfId ff:missedByCount ?missedByCount .
            } WHERE {
                SELECT ?dfId (COUNT(?rp) AS ?missedByCount)
                WHERE {
                    ?dfId ff:isMissedBy ?rp .
                }
                GROUP BY ?dfId
                ORDER BY DESC(?missedByCount) 
            }`
        let priorityListStore = new Store()
        constructedQuads = await runSparqlConstructQueryOnStore(query, missingDataStore)
        for (let quad of constructedQuads) priorityListStore.addQuad(quad)
        this.sendInstantShowValue("output_3", await serializeStoreToTurtle(priorityListStore))

        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT ?subject ?datafield (COUNT(?rp) AS ?missedByCount) WHERE {
                ?dfId ff:isMissedBy ?rp ;
                    ff:hasSub ?subject ;
                    ff:hasPred ?datafield .
            }
            GROUP BY ?subject ?datafield
            ORDER BY DESC(?missedByCount)`
        let rows = await runSparqlSelectQueryOnStore(query, missingDataStore)
        let missingDatafieldsCount = rows.length

        let div = document.createElement("div")
        div.style = "font-size: small; color: gray; margin-bottom: 10px"
        div.textContent = `Questions left: ${missingDatafieldsCount}`
        container.appendChild(div)

        if (missingDatafieldsCount === 0) {
            let h2 = document.createElement("h2")
            h2.textContent = "All questions answered"
            h2.style = "color: blue"
            container.appendChild(h2)
            query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                SELECT * WHERE {
                    ?rp ff:hasEligibilityStatus ?status .
                }`
            let rows = await runSparqlSelectQueryOnStore(query, eligibilityStore)
            for (let row of rows) {
                div = document.createElement("div")
                div.innerHTML = `${localName(row.rp)} &rarr; ${localName(row.status)}`
                container.appendChild(div)
            }
            return
        }

        let subject = rows[0].subject
        let datafield = rows[0].datafield

        div = document.createElement("div")
        div.textContent = `This question is regarding: ${localName(subject)}`
        container.appendChild(div)

        let datafieldsStore = new Store()
        await addRdfStringToStore(this.inputTurtles.dfs, datafieldsStore)
        query = `
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            PREFIX ff: <https://foerderfunke.org/default#>
            SELECT ?question ?class WHERE {
                ?propertyShape sh:path <${datafield}> ;
                    sh:description ?question .
                OPTIONAL { ?propertyShape ff:pointsToInstancesOf ?class . }
            }`
        let row = (await runSparqlSelectQueryOnStore(query, datafieldsStore))[0]
        let h2 = document.createElement("h2")
        h2.textContent = row.question
        container.appendChild(h2)

        let createIndividualsOfClass = row.class

        let input = document.createElement("input")
        input.type = "text"
        input.style = "margin-right: 10px"
        container.appendChild(input)

        let submitBtn = document.createElement("input")
        submitBtn.type = "button"
        submitBtn.value = "Submit"
        const submit = async () => {
            let upStore = new Store()
            await addRdfStringToStore(this.inputTurtles.currentUp, upStore)
            let query
            if (createIndividualsOfClass) {
                query = `INSERT DATA {`
                for (let i = 0; i < Number(input.value); i++) {
                    let individualUri = expand("ff", `${localName(createIndividualsOfClass).toLowerCase()}${i + 1}`)
                    query += `
                        <${subject}> <${datafield}> <${individualUri}> .
                        <${individualUri}> a <${createIndividualsOfClass}> .`
                }
                query += `}`
            } else {
                query = `
                    INSERT DATA {
                        <${subject}> <${datafield}> ${formatObject(input.value)} .
                    }`
            }
            await runSparqlInsertDeleteQueryOnStore(query, upStore)
            this.inputTurtles.currentUp = await serializeStoreToTurtle(upStore)
            await this.rebuild()
        }
        submitBtn.addEventListener("click", async () => await submit())
        input.addEventListener("keyup", async (event) => {
            if (event.key === "Enter") await submit()
        })
        container.appendChild(submitBtn)
        this.rerenderConnectingEdges()
    }

    getValue() { return "" }
    setValue(value) {}
}
