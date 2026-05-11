import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { Store } from "../../../assets/bundle.js"
import { addRdfStringToStore, runValidationOnStore, serializeDatasetToTurtle } from "../../../utils.js"

export class ShaclValidationNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], TYPE.PROCESSOR)
        this.settingsVisible = false
        this.debugOn = initialValues.debugOn ?? false
        this.detailsOn = initialValues.detailsOn ?? false
    }

    async processIncomingData() {
        try {
            let store = new Store()
            for (let port of this.incomingData) await addRdfStringToStore(port.data, store)
            let result = await runValidationOnStore(store, this.debugOn, this.detailsOn)
            return await serializeDatasetToTurtle(result.dataset)
        } catch (err) {
            return this.handleError(err.message)
        }
    }

    toggleSettings() {
        let el = this.nodeDiv.querySelector(".node-settings-container")
        if (this.settingsVisible) {
            this.settingsVisible = false
            while (el.firstChild) el.firstChild.remove()
            el.classList.add("hidden")
            return
        }
        this.settingsVisible = true
        let settingsDiv = document.createElement("span")
        settingsDiv.classList.add("result")
        settingsDiv.appendChild(document.createTextNode("Settings: "))
        el.appendChild(settingsDiv)

        // TODO helper function for these 2:

        let debug = document.createElement("input")
        debug.type = "checkbox"
        debug.checked = this.debugOn
        debug.style = "width: 12px; height: 12px"
        debug.addEventListener("change", () => this.debugOn = debug.checked)
        el.appendChild(debug)
        let debugLabel = document.createElement("label")
        debugLabel.textContent = "Debug "
        debugLabel.style = "font-size: small; color: gray"
        el.appendChild(debugLabel)

        let details = document.createElement("input")
        details.type = "checkbox"
        details.checked = this.detailsOn
        details.style = "width: 12px; height: 12px"
        details.addEventListener("change", () => this.detailsOn = details.checked)
        el.appendChild(details)
        let detailsLabel = document.createElement("label")
        detailsLabel.textContent = "Details "
        detailsLabel.style = "font-size: small; color: gray"
        el.appendChild(detailsLabel)

        el.classList.remove("hidden")
    }
}
