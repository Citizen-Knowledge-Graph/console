import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { expand, localName, runSparqlSelectQueryOnRdfString } from "../../../utils.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
        this.value = ""
        this.formValues = {}
        this.currentShacl = ""
    }

    getMainHtml() {
        return `<div class="shacl-form-container" style="margin: 0 0 10px 10px"/>`
    }

    async processIncomingData() {
        let shacl = this.incomingData[0].data
        if (shacl === this.currentShacl) return "same" // TODO
        this.currentShacl = shacl

        let container = this.nodeDiv.querySelector(".shacl-form-container")
        while (container.firstChild) container.firstChild.remove()

        let query = `
            PREFIX ff: <https://foerderfunke.org/default#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            SELECT * WHERE {
                ?shape sh:targetNode ?targetNode ;
                    sh:property ?property .
                ?property ?p ?o .
            }`
        let rows = await runSparqlSelectQueryOnRdfString(query, shacl)
        let datafields = {}
        for (let row of rows) {
            if (!datafields[row.targetNode]) datafields[row.targetNode] = {}
            let targetNode = datafields[row.targetNode]
            if (!targetNode[row.property]) targetNode[row.property] = {}
            let property = targetNode[row.property]
            property[row.p] = row.o
        }

        for (let targetNode of Object.keys(datafields)) {
            this.formValues[targetNode] = {}
            let name = localName(targetNode)

            let h3 = document.createElement("h3")
            h3.textContent = name
            container.appendChild(h3)

            for (let prop of Object.values(datafields[targetNode])) {
                let propName = prop[expand("sh", "name")]
                let df = prop[expand("sh", "path")]

                let instanceCreation = prop[expand("ff", "pointsToInstancesOf")]
                if (instanceCreation) {
                    let createBtn = document.createElement("input")
                    createBtn.style.marginTop = "10px"
                    createBtn.setAttribute("type", "button")
                    createBtn.setAttribute("value", `+ ${prop[expand("sh", "description")]}`)
                    container.appendChild(createBtn)
                    continue
                }

                let label = document.createElement("label")
                label.textContent = propName
                label.style.marginRight = "10px"
                container.appendChild(label)

                let input = document.createElement("input")
                input.setAttribute("name", propName)
                container.appendChild(input)

                input.addEventListener("change", event => {
                    this.formValues[targetNode][df] = input.value
                    console.log(this.formValues) // TODO
                })
            }
        }
        this.rerenderConnectingEdges()

        return "..."
    }

    getValue() {
        return this.value
    }

    setValue(value) {
        this.value = value
    }
}
