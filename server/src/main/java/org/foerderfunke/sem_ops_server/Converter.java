package org.foerderfunke.sem_ops_server;
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
        Model spinModel = ModelFactory.createDefaultModel();

        org.apache.jena.query.Query arqQuery = ARQFactory.get().createQuery(spinModel, sparql);
        ARQ2SPIN converter = new ARQ2SPIN(spinModel);
        org.spinrdf.model.Query spinQuery = converter.createQuery(arqQuery, null);

        StringWriter writer = new StringWriter();
        spinModel.write(writer, "TURTLE");
        System.out.println(writer);
    }
}
