package com.rt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling 
public class RetailSuiteApplication {

	public static void main(String[] args) {
		SpringApplication.run(RetailSuiteApplication.class, args);
	}

}