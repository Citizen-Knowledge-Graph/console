import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { addRdfStringToStore, expand, localName, runSparqlSelectQueryOnStore, serializeStoreToTurtle, runSparqlInsertDeleteQueryOnStore } from "../../../utils.js"
import { DataFactory, Store } from "../../../assets/bundle.js"

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

    determineObjectType(value, propertyShape) {
        let datatype = propertyShape[expand("sh", "datatype")]
        if (!datatype) return DataFactory.literal(value)
        if (datatype.endsWith("integer")) return DataFactory.literal(Number(value))
        if (datatype.endsWith("anyURI") || value.startsWith("http")) return DataFactory.namedNode(value)
        return DataFactory.literal(value)
    }

    async serializeData() {
        let store = new Store()
        for (let targetNode of Object.keys(this.data)) {
            store.addQuad({
                subject: DataFactory.namedNode(targetNode),
                predicate: DataFactory.namedNode(expand("rdf", "type")),
                object: DataFactory.namedNode(this.data[targetNode].class)
            })
            // TODO
        }
        return await serializeStoreToTurtle(store)
    }

    async updateInternalStateOutput() {
        let edge = Object.values(this.graph.edgesMap).find(edge => edge.sourceNode === this && edge.portOut === "output_2")
        if (!edge) return
        edge.targetNode.justShowValue(await serializeStoreToTurtle(this.store), "turtle")
    }

    async processIncomingData() {
        let shacl = this.incomingData[0].data
        if (shacl === this.currentShacl) return "still dev" // await this.serializeData()
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

                input.addEventListener("change", event => {
                    // event.target.value TODO
                })
            }
        }
        await this.updateInternalStateOutput()
        this.rerenderConnectingEdges()
        return "dev"
    }

    getValue() {
        return this.value
    }

    setValue(value) {
        this.value = value
    }
}
