package com.awsproject.backend.DB_test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DbConnectionTest implements CommandLineRunner {

    private final DataSource dataSource;

    public DbConnectionTest(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1")) {

            if (rs.next() && rs.getInt(1) == 1) {
                System.out.println("✅ Supabase DB 연결 성공!");
            }
        }
    }
}
