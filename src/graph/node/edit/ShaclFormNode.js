import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { expand, localName, runSparqlSelectQueryOnRdfString, serializeStoreToTurtle } from "../../../utils.js"
import { DataFactory, Store } from "../../../assets/bundle.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
        this.value = ""
        this.data = {}
        this.currentShacl = ""
    }

    getMainHtml() {
        return `<div class="shacl-form-container" style="margin: 0 0 10px 10px"/>`
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
            for (let propertyShape of Object.values(this.data[targetNode].propertyShapes)) {
                let propertyName = propertyShape[expand("sh", "path")]
                let value = propertyShape[expand("ff", "value")]
                if (!value) continue
                if (Array.isArray(value)) {
                    for (let v of value) {
                        store.addQuad({
                            subject: DataFactory.namedNode(targetNode),
                            predicate: DataFactory.namedNode(propertyName),
                            object: this.determineObjectType(v, propertyShape)
                        })
                    }
                } else {
                    store.addQuad({
                        subject: DataFactory.namedNode(targetNode),
                        predicate: DataFactory.namedNode(propertyName),
                        object: this.determineObjectType(value, propertyShape)
                    })
                }
            }
        }
        return await serializeStoreToTurtle(store)
    }

    async processIncomingData() {
        let shacl = this.incomingData[0].data
        if (shacl === this.currentShacl) return await this.serializeData()
        this.currentShacl = shacl

        let container = this.nodeDiv.querySelector(".shacl-form-container")
        while (container.firstChild) container.firstChild.remove()

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?shape sh:targetNode ?targetNode ;
                    ff:instanceOf ?class ;
                    sh:property ?propertyShape .
                ?propertyShape ?property ?value .
            }`
        let rows = await runSparqlSelectQueryOnRdfString(query, shacl)

        // prepare data structure
        this.data = {}
        for (let row of rows) {
            if (!this.data[row.targetNode]) {
                this.data[row.targetNode] = { propertyShapes: {}, class: row.class }
            }
            let targetNode = this.data[row.targetNode]
            if (!targetNode.propertyShapes[row.propertyShape]) {
                targetNode.propertyShapes[row.propertyShape] = {}
            }
            let propertyShape = targetNode.propertyShapes[row.propertyShape]
            let ffValue = expand("ff", "value")
            if (row.property === ffValue) {
                if (!propertyShape[row.property]) propertyShape[row.property] = []
                propertyShape[row.property].push(row.value)
            } else {
                propertyShape[row.property] = row.value
            }
        }

        // build form
        for (let targetNode of Object.keys(this.data)) {
            let name = localName(targetNode)

            let h3 = document.createElement("h3")
            h3.textContent = name
            container.appendChild(h3)

            for (let propertyShape of Object.values(this.data[targetNode].propertyShapes)) {
                let propertyName = propertyShape[expand("sh", "name")]
                let df = propertyShape[expand("sh", "path")]
                let value = propertyShape[expand("ff", "value")]
                let instanceCreation = propertyShape[expand("ff", "pointsToInstancesOf")]

                if (instanceCreation) {
                    let createBtn = document.createElement("input")
                    createBtn.style.marginTop = "10px"
                    createBtn.setAttribute("type", "button")
                    createBtn.setAttribute("value", `+ ${propertyShape[expand("sh", "description")]}`)
                    container.appendChild(createBtn)
                    continue
                }

                let label = document.createElement("label")
                label.textContent = propertyName
                label.style.marginRight = "10px"
                container.appendChild(label)

                let input = document.createElement("input")
                input.setAttribute("name", propertyName)
                if (value) input.setAttribute("value", value)
                container.appendChild(input)

                input.addEventListener("change", event => {
                    propertyShape[expand("ff", "value")] = event.target.value
                })
            }
        }
        this.rerenderConnectingEdges()
        return await this.serializeData()
    }

    getValue() {
        return this.value
    }

    setValue(value) {
        this.value = value
    }
}
