import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, expand, localName, runSparqlSelectQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore, runSparqlConstructQueryOnStore, formatObject, runValidationOnStore, serializeDatasetToTurtle } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = null
        this.currentShacl = ""
    }

    getMainHtml() {
        return `<div class="shacl-form-container" style="margin: 0 0 20px 10px"/>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("output", ["Form output", "Internal form state", "Validation result"])
    }

    async serializeFormOutput() {
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
        let outgoingEdges = Object.values(this.graph.edgesMap).filter(edge => edge.sourceNode === this)
        let edge = outgoingEdges.find(edge => edge.portOut === "output_1")
        if (edge) edge.targetNode.justShowValue(await this.serializeFormOutput(), "turtle")
        edge = outgoingEdges.find(edge => edge.portOut === "output_2")
        if (edge) edge.targetNode.justShowValue(await serializeStoreToTurtle(this.store), "turtle")
        let result = await runValidationOnStore(this.store)
        // TODO
        edge = outgoingEdges.find(edge => edge.portOut === "output_3")
        if (edge) edge.targetNode.justShowValue(await serializeDatasetToTurtle(result.dataset), "turtle")
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
        let title = (await runSparqlSelectQueryOnStore(query, this.store))[0].title
        let h2 = document.createElement("h2")
        h2.textContent = title
        container.appendChild(h2)

        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT ?targetNode ?class WHERE {
                ?nodeShape sh:targetNode ?targetNode ;
                    ff:instanceOf ?class .
            }`
        let targetNodes = (await runSparqlSelectQueryOnStore(query, this.store)).map(result => [result.targetNode, result.class])

        for (let [targetNode, targetNodeClass] of targetNodes) {
            let name = localName(targetNode)
            let h3 = document.createElement("h3")
            h3.textContent = name
            if (!targetNode.endsWith("mainPerson")) {
                let del = document.createElement("span")
                del.innerHTML = "&#10005;"
                del.style = "font-weight: normal; color: silver; font-size: x-small; margin-left: 5px; cursor: pointer;"
                del.addEventListener("click", async () => {
                    let query = `
                        DELETE { ?s ?p ?o } WHERE {
                            ?s ?p ?o . FILTER(?s = <${targetNode}> || ?o = <${targetNode}>)
                        }`
                    await runSparqlInsertDeleteQueryOnStore(query, this.store)
                    await this.update()
                    this.graph.run()
                })
                h3.appendChild(del)
            }
            container.appendChild(h3)
            query = `
                PREFIX ff: <https://foerderfunke.org/default#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                SELECT ?propertyShape ?pointsToInstancesOf WHERE {
                    ?nodeShape sh:targetNode <${targetNode}> ;
                        sh:property ?propertyShape .
                    OPTIONAL { ?propertyShape ff:pointsToInstancesOf ?pointsToInstancesOf . }
                }`
            let propertyShapes = (await runSparqlSelectQueryOnStore(query, this.store)).map(result => [result.propertyShape, result.pointsToInstancesOf])

            for (let [propertyShape, pointsToInstancesOf] of propertyShapes) {
                query = `
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    SELECT * WHERE {
                        <${propertyShape}> a sh:PropertyShape ;
                            ?propKey ?propValue ;
                            sh:path ?path .
                      OPTIONAL { <${targetNode}> ?path ?value } .
                    }`
                let properties = {};
                let results = await runSparqlSelectQueryOnStore(query, this.store)
                results.forEach(result => properties[result.propKey] = result.propValue)
                let datafieldValue = results[0].value

                let path = properties[expand("sh", "path")] // datafield

                if (pointsToInstancesOf) {
                    let btn = document.createElement("input")
                    btn.style.marginTop = "10px"
                    btn.setAttribute("type", "button")
                    btn.setAttribute("value", `+ ${properties[expand("sh", "description")]}`)
                    btn.addEventListener("click", async () => {
                        let query = `
                            SELECT (COUNT(?existingIndividual) AS ?count) WHERE {
                                <${targetNode}> <${path}> ?existingIndividual .
                            }`
                        let count = (await runSparqlSelectQueryOnStore(query, this.store))[0].count
                        // this is not a stable solution, if child0 gets deleted, child1 is already there TODO
                        let newIndividual = pointsToInstancesOf.toLowerCase() + count
                        query = `
                            INSERT DATA {
                              <${targetNode}> <${path}> <${newIndividual}> .
                              <${newIndividual}> a <${pointsToInstancesOf}> .
                            }`
                        await runSparqlInsertDeleteQueryOnStore(query, this.store)
                        await this.update()
                        this.graph.run() // workaround
                    })
                    container.appendChild(btn)
                    continue
                }

                let label = document.createElement("label")
                label.textContent = properties[expand("sh", "name")]
                label.style.marginRight = "10px"
                container.appendChild(label)

                const handleChange = async (newValue) => {
                    let query = `SELECT * WHERE { <${targetNode}> <${path}> ?oldValue . }`
                    let valueBeforeChange = formatObject((await runSparqlSelectQueryOnStore(query, this.store))[0]?.oldValue)
                    let valueAfterChange = formatObject(newValue)
                    if (valueAfterChange) {
                        if (valueBeforeChange) {
                            query = `DELETE DATA { <${targetNode}> <${path}> ${valueBeforeChange} . };
                                INSERT DATA { <${targetNode}> <${path}> ${valueAfterChange} . }`
                        } else {
                            query = `INSERT DATA { <${targetNode}> <${path}> ${valueAfterChange} . }`
                        }
                    } else {
                        query = `DELETE DATA { <${targetNode}> <${path}> ${valueBeforeChange} . }`
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
                    container.appendChild(document.createElement("br"))
                    container.appendChild(document.createElement("br"))
                    continue
                }

                let input = document.createElement("input")
                if (datafieldValue) input.setAttribute("value", datafieldValue)
                input.addEventListener("change", async event => await handleChange(event.target.value))
                container.appendChild(input)
            }
        }
        await this.update()
        this.rerenderConnectingEdges()
        return null
    }

    getValue() { return null }
    setValue(value) {}
}
