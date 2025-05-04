package org.foerderfunke.sem_ops_server;
import org.apache.jena.query.Query;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.spinrdf.arq.ARQ2SPIN;
import org.spinrdf.arq.ARQFactory;

import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;

import java.io.StringWriter;

public class Converter {

    public String sparqlToSpin(String sparql) {
        // String sparql = "SELECT * WHERE { ?s ?p ?o }";

        Model model = ModelFactory.createDefaultModel();
        model.setNsPrefix("sp",   "http://spinrdf.org/sp#");
        model.setNsPrefix("rdf",  "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
        model.setNsPrefix("rdfs", "http://www.w3.org/2000/01/rdf-schema#");
        model.setNsPrefix("xsd",  "http://www.w3.org/2001/XMLSchema#");
        model.setNsPrefix("ff",   "https://foerderfunke.org/default#");
        model.setNsPrefix("sh",   "http://www.w3.org/ns/shacl#");

        Query arqQuery = ARQFactory.get().createQuery(model, sparql);
        ARQ2SPIN converter = new ARQ2SPIN(model);
        converter.createQuery(arqQuery, null); // org.spinrdf.model.Query

        StringWriter writer = new StringWriter();
        RDFDataMgr.write(writer, model, RDFFormat.TURTLE_PRETTY);
        return writer.toString();
    }
}
