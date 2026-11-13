package com.awsproject.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

// This full-context test requires an actual PostgreSQL connection.
@EnabledIfEnvironmentVariable(named = "SUPABASE_DB_URL", matches = "\\S+")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@SpringBootTest(properties = {
	"spring.datasource.hikari.maximum-pool-size=1",
	"spring.datasource.hikari.minimum-idle=0"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
