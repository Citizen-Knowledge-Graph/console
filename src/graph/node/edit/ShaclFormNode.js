import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { runSparqlSelectQueryOnRdfString } from "../../../utils.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
        this.value = ""
    }

    getMainHtml() {
        return `<div class="shacl-form-container"/>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["SHACL", "Turtle: form values (optional)"])
    }

    async processIncomingData() {
        return new Promise(async (resolve, reject) => {
            // rebuilding it every time is not very elegant
            let container = this.nodeDiv.querySelector(".shacl-form-container")
            while (container.firstChild) container.firstChild.remove()
            this.form = document.createElement("shacl-form")
            this.form.addEventListener("change", event => {
                if (event.detail?.valid) {
                    // TODO
                    this.value = this.form.serialize()
                }
            })
            container.appendChild(this.form)
            let shacl = this.incomingData[0].data
            let query = `
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                SELECT * WHERE {
                    ?shape sh:targetNode ?targetNode .
                }`
            let results = await runSparqlSelectQueryOnRdfString(query, shacl)
            if (results.length > 0 && results[0].targetNode) {
                this.form.setAttribute("data-values-subject", results[0].targetNode)
            }
            this.form.setAttribute("data-shapes", shacl)
            if (this.incomingData.length > 1) {
                let dataValues = this.incomingData[1].data
                this.form.setAttribute("data-values", dataValues)
                try {
                    const serialized = await this.waitForFormSerialization()
                    this.rerenderConnectingEdges()
                    return serialized
                } catch (error) {
                    console.error(error)
                    return null
                }
            }
            setTimeout(() => { // find a better solution TODO
                resolve(this.form.serialize())
            }, 600)
        })
    }

    waitForFormSerialization(interval = 50, timeout = 2000) {
        // or use MutationObserver instead for the children of shacl-form?
        return new Promise((resolve, reject) => {
            const startTime = performance.now()
            const checkInterval = setInterval(() => {
                const serialized = this.form.serialize()
                if (serialized) {
                    clearInterval(checkInterval)
                    resolve(serialized)
                } else if (performance.now() - startTime > timeout) {
                    clearInterval(checkInterval)
                    reject(new Error(`Form serialization timed out after ${timeout / 1000} sec`))
                }
            }, interval)
        })
    }

    enoughIncomingDataAvailable() {
        return this.countIncomingEdges() === this.incomingData.length
    }

    getValue() {
        return this.value
    }

    setValue(value) {
        this.value = value
    }
}
