import path from "path"
import { fileURLToPath } from "url"
import fs, { promises as fsPromise } from "fs"
import { describe } from "mocha"
import { strictEqual } from "node:assert"
import { buildValidator, datasetToTurtle, parser, turtleToDataset } from "@foerderfunke/sem-ops-utils"

const debug = true

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHACL_DIR_1 = `${ROOT}/shacl`
const SHACL_DIR_2 = `${ROOT}/beta`
const SHACL_DIR_3 = `${ROOT}/bielefeld/shacl`
const DATAFIELDS_FILE_1 = `${ROOT}/datafields.ttl`
const DATAFIELDS_FILE_2 = `${ROOT}/bielefeld/datafields-bielefeld.ttl`
const CONSISTENCY_FILE = `${ROOT}/consistency.ttl` // TODO
const DEFINITIONS_FILE = `${ROOT}/definitions.ttl` // TODO
const MATERIALIZATION_FILE = `${ROOT}/materialization.ttl`

describe("Turtle files integrity", function () {
    let turtleFiles = [ DATAFIELDS_FILE_1, DATAFIELDS_FILE_2, MATERIALIZATION_FILE ]

    before(async function () {
        try {
            turtleFiles = turtleFiles.concat((await fsPromise.readdir(SHACL_DIR_1)).map(file => `${SHACL_DIR_1}/${file}`))
            turtleFiles = turtleFiles.concat((await fsPromise.readdir(SHACL_DIR_2)).map(file => `${SHACL_DIR_2}/${file}`))
            turtleFiles = turtleFiles.concat((await fsPromise.readdir(SHACL_DIR_3)).map(file => `${SHACL_DIR_3}/${file}`))
        } catch (error) {
            throw new Error(`Failed to collect turtle files: ${error.message}`)
        }
    })

    it("should contain Turtle files", function () {
        strictEqual(turtleFiles.length > 0, true, "No turtle files found")
    })

    it("should have .ttl extension", function () {
        turtleFiles.forEach((file) => {
            strictEqual(file.toLowerCase().endsWith(".ttl"), true, `File ${file} does not have a .ttl extension`)
        })
    })

    describe("files should exist and be readable", function () {
        it("should exist", function () {
            turtleFiles.forEach((file) => {
                strictEqual(fs.existsSync(file), true, `File ${file} does not exist`)
            })
        })

        it("should be readable as string and not be empty", async function () {
            for (const file of turtleFiles) {
                let content = await fsPromise.readFile(file, "utf8")
                strictEqual(typeof content, "string", `File ${file} is not readable as a string`)
                strictEqual(content.length > 0, true, `File ${file} is empty`)
            }
        })

        it("should have valid line endings", async function () {
            for (const file of turtleFiles) {
                let content = await fsPromise.readFile(file, "utf8")
                const hasLF = content.includes("\n")
                const hasCRLF = content.includes("\r\n")
                strictEqual(!(hasLF && hasCRLF), true,`File ${file} contains mixed line endings (both LF and CRLF)`)
            }
        })
    })

    describe("files should have valid Turtle syntax", function () {
        it("should be parseable and contain quads", async function () {
            const parse = (content) => {
                let count = 0
                return new Promise((resolve, reject) => {
                    parser.parse(content, (err, quad) => {
                        if (err) reject(err)
                        if (quad) count ++
                        else resolve(count)
                    })
                })
            }
            for (const file of turtleFiles) {
                let content = await fsPromise.readFile(file, "utf8")
                let count = 0
                try {
                    count = await parse(content)
                } catch (err) {
                    throw new Error(`Invalid Turtle syntax in ${file}: ${err.message}`)
                }
                strictEqual(count > 0, true, `No parseable quads in ${file}`)
            }
        })
    })
})


describe("Content-related tests on Turtle files", function () {
    let datasets = {
        shacl: {},
        datafields: {},
        materialization: {}
    }

    before(async function () {
        try {
            const buildDs = async (file) => {
                let str = await fsPromise.readFile(file, "utf8")
                return { file: file, str: str, ds: turtleToDataset(str) }
            }
            for (const file of (await fsPromise.readdir(SHACL_DIR_1))) datasets.shacl[file] = await buildDs(`${SHACL_DIR_1}/${file}`)
            for (const file of (await fsPromise.readdir(SHACL_DIR_2))) datasets.shacl[file] = await buildDs(`${SHACL_DIR_2}/${file}`)
            for (const file of (await fsPromise.readdir(SHACL_DIR_3))) datasets.shacl[file] = await buildDs(`${SHACL_DIR_3}/${file}`)
            datasets.datafields = await buildDs(DATAFIELDS_FILE_1)
            // TODO
            datasets.materialization = await buildDs(MATERIALIZATION_FILE)
        } catch (error) {
            throw new Error(`Failed to read file contents: ${error.message}`)
        }
    })

    it("should have file contents ready", function () {
        strictEqual(Object.keys(datasets.shacl).length > 0, true, "No SHACL files found")
        strictEqual(Object.keys(datasets.datafields).length > 0, true, "Datafields file is empty")
        strictEqual(Object.keys(datasets.materialization).length > 0, true, "Materialization file is empty")
    })

    describe.skip("Assertions on all turtle files", function () {
        describe("All language strings must to be available in @de and @en", function () {
            // --> objects of: rdfs:label, schema:question, rdfs:comment, ff:title, ff:benefitInfo, ff:ineligibleGeneralExplanation
            // TODO
        })
    })

    describe.skip("Assertions on datafields", function () {
        // TODO fix
        it.skip("Each datafield should have a ff:hasShaclShape with the correct sh:path", async function () {
            let shacl = `
                    @prefix sh: <http://www.w3.org/ns/shacl#> .
                    @prefix ff: <https://foerderfunke.org/default#> .
                    [] a sh:NodeShape ;
                        sh:targetClass ff:DataField ;
                        sh:property [
                            sh:path (ff:hasShaclShape sh:property sh:path) ;
                            sh:minCount 1 ;
                        ] .`
            let validator = buildValidator(shacl)
            let result = await validator.validate({ dataset: datasets.datafields })
            strictEqual(result.conforms, true, "Not all datafield have the correct path in their SHACL shape")
        })
    })

    describe.skip("Assertions on requirement profiles alone", function () {
        describe("SHACL assertions on requirement profiles", function () {
            // one it() per file, otherwise the test stops at first error TODO
            it("sh:minCount should be on each PropertyShape", async function () {
                let shacl = `
                    @prefix sh: <http://www.w3.org/ns/shacl#> .
                    @prefix ff: <https://foerderfunke.org/default#> .
                    ff:EnsureMinCountOnPropertyShapes a sh:NodeShape ;
                        sh:targetObjectsOf sh:property ;
                        sh:property [
                            a sh:PropertyShape ;
                            sh:path sh:minCount ;
                            sh:minCount 1 ;
                        ] .`
                let validator = buildValidator(shacl)

                for (let entry of Object.values(datasets.shacl)) {
                    let result = await validator.validate({ dataset: entry.ds })
                    if (!result.conforms && debug) {
                        let turtle = datasetToTurtle(result.dataset)
                        console.log(`Validation report for file ${entry.file}`, turtle)
                    }
                    strictEqual(result.conforms, true, `PropertyShapes without sh:minCount exist in ${entry.file}`)
                }
            })
        })

        // TODO
    })
})
