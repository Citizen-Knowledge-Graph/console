import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { expand, localName, runSparqlSelectQueryOnRdfString, serializeStoreToTurtle } from "../../../utils.js"
import { DataFactory, Store } from "../../../assets/bundle.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
        this.value = ""
        this.classConnectors = []
        this.data = {}
    }

    getMainHtml() {
        return `<div class="shacl-form-container" style="margin: 0 0 10px 10px"/>`
    }

    linkIndividuals(targetNode, store) {
        // this is a bit awkward, there must be a better solution
        // do we have individuals whose class has a classConnector registered with this class?
        let classHit = this.classConnectors.find(cc => cc.childClass === this.data[targetNode].class)
        if (!classHit) return
        let individualHit = Object.keys(this.data).find(individual => this.data[individual].class === classHit.parentClass)
        if (!individualHit) return
        store.addQuad({
            subject: DataFactory.namedNode(individualHit),
            predicate: DataFactory.namedNode(classHit.path),
            object: DataFactory.namedNode(targetNode)
        })
    }

    async serializeData() {
        let store = new Store()
        for (let targetNode of Object.keys(this.data)) {
            store.addQuad({
                subject: DataFactory.namedNode(targetNode),
                predicate: DataFactory.namedNode(expand("rdf", "type")),
                object: DataFactory.namedNode(this.data[targetNode].class)
            })
            this.linkIndividuals(targetNode, store)
        }
        return await serializeStoreToTurtle(store)
    }

    async processIncomingData() {
        let container = this.nodeDiv.querySelector(".shacl-form-container")
        while (container.firstChild) container.firstChild.remove()

        let shacl = this.incomingData[0].data

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT ?parentClass ?path ?childClass WHERE {
                ?nodeShape ff:instanceOf ?parentClass .
                ?nodeShape sh:property ?propertyShape .
                ?propertyShape ff:pointsToInstancesOf ?childClass .
                ?propertyShape sh:path ?path .
            }`
        let rows = await runSparqlSelectQueryOnRdfString(query, shacl)
        for (let row of rows) {
            this.classConnectors.push({ parentClass: row.parentClass, path: row.path, childClass: row.childClass })
        }
        query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?shape sh:targetNode ?targetNode ;
                    ff:instanceOf ?class ;
                    sh:property ?propertyShape .
                ?propertyShape ?property ?value .
            }`
        rows = await runSparqlSelectQueryOnRdfString(query, shacl)

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
            propertyShape[row.property] = row.value
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
                    // TODO
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
