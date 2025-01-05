import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class OutputViewNodeWithInitialInput extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.INPUT)
        this.latestManualInput = ""
        this.currentlyHasManualInput = true
        this.disregardNextChangeEvent = false
    }

    enoughIncomingDataAvailable() {
        return this.currentlyHasManualInput || this.countIncomingEdges() === this.incomingData.length
    }

    receiveDataPackage(dataPackage) {
        this.currentlyHasManualInput = false
        super.receiveDataPackage(dataPackage)
    }

    processIncomingData() {
        let incoming = this.incomingData[0]
        if (incoming && incoming.data) {
            this.disregardNextChangeEvent = true // otherwise latestManualInput would be overwritten by the "non-manual" incoming data
            this.currentlyHasManualInput = false
            return incoming.data
        }
        return this.getValue()
    }

    onCodeMirrorChange() {
        if (!this.disregardNextChangeEvent) {
            this.latestManualInput = this.codeMirror.getValue()
            this.currentlyHasManualInput = true
        }
        this.disregardNextChangeEvent = false
    }

    /*getValue(isForExport = false) { // TODO
        return isForExport ? this.latestManualInput : this.codeMirror.getValue()
    }*/
}
