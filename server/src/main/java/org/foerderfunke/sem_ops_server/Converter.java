package org.foerderfunke.sem_ops_server;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.spinrdf.arq.ARQ2SPIN;
import org.spinrdf.system.SPINModuleRegistry;
import org.spinrdf.arq.ARQFactory;

import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;

import java.io.StringWriter;

public class Converter {

    public void sparqlToSpin() {
        String sparql = "SELECT * WHERE { ?s ?p ?o }";

        SPINModuleRegistry.get().init();
        Model model = ModelFactory.createDefaultModel();
        model.setNsPrefix("sp",   "http://spinrdf.org/sp#");
        model.setNsPrefix("rdf",  "http://www.w3.org/1999/02/22-rdf-syntax-ns#");

        org.apache.jena.query.Query arqQuery = ARQFactory.get().createQuery(model, sparql);
        ARQ2SPIN converter = new ARQ2SPIN(model);
        org.spinrdf.model.Query spinQuery = converter.createQuery(arqQuery, null);

        StringWriter writer = new StringWriter();
        RDFDataMgr.write(writer, model, RDFFormat.TURTLE_PRETTY);
        System.out.println(writer);
    }
}
