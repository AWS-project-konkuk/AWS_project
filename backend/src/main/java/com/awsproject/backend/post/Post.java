package com.awsproject.backend.post;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;

import java.time.OffsetDateTime;
import tools.jackson.databind.JsonNode;

import org.hibernate.type.SqlTypes;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "posts")
public class Post {

    protected Post(){

    }

    public Post(String author, String password, String title, String body, JsonNode workflow){
        this.author = author;
        this.password = password;
        this.title = title;
        this.body = body;
        this.workflow = workflow;
    }
    public Post(String author, String password, String title, String body){
        this(author, password, title, body, null);
    }
    @Id
    @Generated
    @ColumnDefault ("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String author;
    
    @Column (nullable = false, columnDefinition = "TEXT")
    private String password;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "workflow", columnDefinition = "jsonb")
    private JsonNode workflow;

    @Generated(event = EventType.INSERT)
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Generated(event = EventType.INSERT)
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
