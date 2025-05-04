package org.foerderfunke.sem_ops_server;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Controller {

    Converter converter = new Converter();

    @CrossOrigin(origins = "*")
    @GetMapping(value = "/sparqlToSpin", produces = "text/turtle")
    public String sparqlToSpin(@RequestParam String sparql) {
        System.out.println("Received sparqlToSpin request");
        return converter.sparqlToSpin(sparql);
    }
}
