package com.awsproject.backend.post;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.generator.EventType;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import tools.jackson.databind.JsonNode;

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

    public void update(String title, String body, JsonNode workflow) {
        if(title != null){
            this.title = title;
        }
        if(body != null){
            this.body = body;
        }
        if(workflow != null){
            this.workflow = workflow;
        }
    }

    public boolean isPasswordMatch(String password, PasswordEncoder passwordEncoder) {
        return passwordEncoder.matches(password, this.password);
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

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() {
        return id;
    }

    public String getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public JsonNode getWorkflow() {
        return workflow;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    
}
