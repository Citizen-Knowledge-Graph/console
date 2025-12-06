import path from "path"
import { fileURLToPath } from "url"
import { promises, writeFileSync } from "fs"
import { newStore, addTurtleToStore, storeToTurtle, sparqlInsertDelete } from "@foerderfunke/sem-ops-utils"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)))
await promises.mkdir(`${ROOT}/build`, { recursive: true })

// ----------- def.built.ttl -----------

let header = ["# This file is a generated enriched merge of the following source files:"]
const dfDir = path.join(ROOT, "datafields")

const defTurtleFiles = [
    `${ROOT}/definitions.ttl`,
    `${ROOT}/materialization.ttl`,
    ...(await promises.readdir(dfDir)).filter(f => f.endsWith(".ttl")).map(f => path.join(dfDir, f))
]

let defStore = newStore()
for (let file of defTurtleFiles) {
    header.push("# - " + file.substring(ROOT.length + 1))
    addTurtleToStore(defStore, await promises.readFile(file, "utf8"))
}

// ensure language tag @de-x-es: if not present, copy from @de
const query = `
    PREFIX ff: <https://foerderfunke.org/default#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX schema: <http://schema.org/>
    INSERT {
        ?subj ?pred ?labelDeEs .
    } WHERE {
        ?subj ?pred ?labelDe .
        FILTER(?pred IN (rdfs:label, schema:question, rdfs:comment, ff:title, ff:benefitInfo, ff:ineligibleGeneralExplanation))
        FILTER(LANG(?labelDe) = "de")
        FILTER NOT EXISTS {
            ?subj ?pred ?any .
            FILTER(LANG(?any) = "de-x-es")
        }
        BIND(STRLANG(STR(?labelDe), "de-x-es") AS ?labelDeEs)
    }`
await sparqlInsertDelete(query, defStore)

let turtle = header.join("\n") + "\n\n" + await storeToTurtle(defStore)
let target = `${ROOT}/build/def.built.ttl`
writeFileSync(target, turtle, "utf8")
console.log(`Wrote to ${target}`)

// ----------- rps.built.ttl -----------

header = ["# This file is a generated merge of the following source files:"]
const shaclDirs = [
    `${ROOT}/shacl`,
    `${ROOT}/shacl/beta`,
    `${ROOT}/shacl/bielefeld`
]
let shaclFiles = []
for (let shaclDir of shaclDirs) {
    shaclFiles = shaclFiles.concat((await promises.readdir(shaclDir)).map(file => `${shaclDir}/${file}`).filter(file => file.endsWith(".ttl")))
}

let rpsStore = newStore()
for (let file of shaclFiles) {
    header.push("# - " + file.substring(ROOT.length + 1))
    addTurtleToStore(rpsStore, await promises.readFile(file, "utf8"))
}

turtle = header.join("\n") + "\n\n" + await storeToTurtle(rpsStore)
target = `${ROOT}/build/rps.built.ttl`
writeFileSync(target, turtle, "utf8")
console.log(`Wrote to ${target}`)
