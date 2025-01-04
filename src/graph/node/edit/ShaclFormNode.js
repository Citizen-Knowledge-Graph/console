import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, expand, localName, runSparqlSelectQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore, runSparqlConstructQueryOnStore } from "../../../utils.js"
import { Store } from "../../../assets/bundle.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE, PORT.TURTLE ], TYPE.EDIT)
        this.store = new Store()
        this.value = ""
        this.currentShacl = ""
    }

    getMainHtml() {
        return `<div class="shacl-form-container" style="margin: 0 0 10px 10px"/>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("output", ["Form output", "Internal form state"])
    }

    async serializeData() {
        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            CONSTRUCT {
                ?targetNode a ?targetNodeClass ;
                    ?path ?value .
            } WHERE {
                ?nodeShape sh:targetNode ?targetNode ;
                    ff:instanceOf ?targetNodeClass ;
                    sh:property ?propertyShape .
                ?propertyShape sh:path ?path .
                OPTIONAL { ?propertyShape ff:value ?value . }
            }`
        let constructedQuads = await runSparqlConstructQueryOnStore(query, this.store)
        let store = new Store()
        for (let quad of constructedQuads) store.addQuad(quad)
        return await serializeStoreToTurtle(store)
    }

    async updateInternalStateOutput() {
        let edge = Object.values(this.graph.edgesMap).find(edge => edge.sourceNode === this && edge.portOut === "output_2")
        if (!edge) return
        edge.targetNode.justShowValue(await serializeStoreToTurtle(this.store), "turtle")
    }

    async processIncomingData() {
        let shacl = this.incomingData[0].data
        if (shacl === this.currentShacl) return await this.serializeData()
        this.currentShacl = shacl

        let container = this.nodeDiv.querySelector(".shacl-form-container")
        while (container.firstChild) container.firstChild.remove()

        await addRdfStringToStore(shacl, this.store)

        let query = `
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
                            ?key ?value .
                    }`
                let properties = {};
                (await runSparqlSelectQueryOnStore(query, this.store)).forEach(result => properties[result.key] = result.value)

                if (pointsToInstancesOf) {
                    let btn = document.createElement("input")
                    btn.style.marginTop = "10px"
                    btn.setAttribute("type", "button")
                    btn.setAttribute("value", `+ ${properties[expand("sh", "description")]}`)
                    btn.addEventListener("click", () => {
                        // TODO
                    })
                    container.appendChild(btn)
                    continue
                }

                let label = document.createElement("label")
                label.textContent = properties[expand("sh", "name")]
                label.style.marginRight = "10px"
                container.appendChild(label)

                let input = document.createElement("input")
                let value = properties[expand("ff", "value")]
                if (value) input.setAttribute("value", value)
                container.appendChild(input)

                input.addEventListener("change", async event => {
                    query = `
                        PREFIX ff: <https://foerderfunke.org/default#>
                        PREFIX sh: <http://www.w3.org/ns/shacl#>
                        DELETE {
                          <${propertyShape}> ff:value ?oldValue .
                        } INSERT {
                          <${propertyShape}> ff:value ${event.target.value} .
                        } WHERE {
                          <${propertyShape}> ff:value ?oldValue .
                        }`
                    await runSparqlInsertDeleteQueryOnStore(query, this.store)
                    await this.updateInternalStateOutput()
                })
            }
        }
        await this.updateInternalStateOutput()
        this.rerenderConnectingEdges()
        return this.serializeData()
    }

    getValue() {
        return this.value
    }

    setValue(value) {
        this.value = value
    }
}
