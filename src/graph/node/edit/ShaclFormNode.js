import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class ShaclFormNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
    }

    getMainHtml() {
        return `<shacl-form></shacl-form>`
    }

    postConstructor() {
        super.postConstructor()
        this.form = this.nodeDiv.querySelector("shacl-form")
        let dataShape = `
            @prefix sh:   <http://www.w3.org/ns/shacl#> .
            @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
            @prefix ff:   <https://foerderfunke.org/default#> .
            ff:DevShape a sh:NodeShape, rdfs:Class ;
            sh:property [
                sh:name "dev value" ;
                sh:path ff:dev ;
            ] .`
        this.form.setAttribute("data-shapes", dataShape)
    }

    async processIncomingData() {}
}
