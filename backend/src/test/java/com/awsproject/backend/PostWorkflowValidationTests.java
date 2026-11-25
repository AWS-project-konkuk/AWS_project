package com.awsproject.backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.awsproject.backend.post.Post;
import com.awsproject.backend.post.PostController;
import com.awsproject.backend.post.PostService;

@WebMvcTest(PostController.class)
class PostWorkflowValidationTests {
    private static final String VALID_WORKFLOW = """
        {
          "version": 2,
          "graph": {
            "entities": [
              {
                "id": "root",
                "name": "Root",
                "type": "system",
                "kind": "root",
                "parent": "root",
                "position": {"x": 0, "y": 0},
                "width": 800,
                "height": 600
              },
              {
                "id": "dataset-1",
                "name": "Dataset",
                "type": "resource",
                "kind": "dataset",
                "parent": "root",
                "position": {"x": 100, "y": 100},
                "ports": [
                  {"id": "out", "direction": "out", "material": "data", "multiple": false}
                ],
                "version": "v1",
                "replicas": 1
              }
            ],
            "connections": [
              {
                "id": "dataset-to-root",
                "from": {"node": "dataset-1", "port": "out"},
                "to": {"node": "root", "port": "in"}
              }
            ]
          }
        }
        """;

    @Autowired MockMvc mvc;
    @MockitoBean PostService postService;

    @Test
    void acceptsFrontendWorkflowFormat() throws Exception {
        when(postService.createPost(any(), any(), any(), any(), any()))
                .thenReturn(new Post("author", "hashed", "title", "body"));

        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody(VALID_WORKFLOW)))
                .andExpect(status().isCreated());

        verify(postService).createPost(any(), any(), any(), any(), any());
    }

    @Test
    void acceptsRootEntityWithEmptyParent() throws Exception {
        // The frontend's root entity has an empty string as its parent.
        when(postService.createPost(any(), any(), any(), any(), any()))
                .thenReturn(new Post("author", "hashed", "title", "body"));

        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody(workflowWithParents("", "root"))))
                .andExpect(status().isCreated());

        verify(postService).createPost(any(), any(), any(), any(), any());
    }

    @Test
    void rejectsNonRootEntityWithEmptyParent() throws Exception {
        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody(workflowWithParents("", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        verify(postService, never()).createPost(any(), any(), any(), any(), any());
    }

    @Test
    void rejectsLegacyOrMalformedWorkflowBeforeSaving() throws Exception {
        String invalidWorkflow = """
            {"version": 1, "graph": {"nodes": [], "edges": []}}
            """;

        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody(invalidWorkflow)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        verify(postService, never()).createPost(any(), any(), any(), any(), any());
    }

    @Test
    void rejectsConnectionToUnknownEntityOnUpdate() throws Exception {
        String invalidWorkflow = """
            {
              "version": 2,
              "graph": {
                "entities": [],
                "connections": [{
                  "id": "missing",
                  "from": {"node": "missing-a", "port": "out"},
                  "to": {"node": "missing-b", "port": "in"}
                }]
              }
            }
            """;

        mvc.perform(patch("/api/posts/{id}", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody(invalidWorkflow)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        verify(postService, never()).updatePost(any(), any(), any(), any(), any());
    }

    @Test
    void rejectsNullWorkflowWithRequirementsStatus() throws Exception {
        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody("null")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("WORKFLOW_REQUIREMENTS_NOT_MET"));

        verify(postService, never()).createPost(any(), any(), any(), any(), any());
    }

    @Test
    void rejectsTooFewEntitiesWithRequirementsStatus() throws Exception {
        String workflow = """
            {
              "version": 2,
              "graph": {
                "entities": [{
                  "id": "root",
                  "name": "Root",
                  "type": "system",
                  "kind": "root",
                  "parent": "root",
                  "position": {"x": 0, "y": 0},
                  "width": 800,
                  "height": 600
                }],
                "connections": []
              }
            }
            """;

        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody(workflow)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("WORKFLOW_REQUIREMENTS_NOT_MET"));
    }

    @Test
    void rejectsTooFewConnectionsWithRequirementsStatus() throws Exception {
        int connectionsField = VALID_WORKFLOW.indexOf("\"connections\"");
        int connectionsStart = VALID_WORKFLOW.indexOf('[', connectionsField);
        int connectionsEnd = VALID_WORKFLOW.indexOf(']', connectionsStart);
        String workflow = VALID_WORKFLOW.substring(0, connectionsStart)
                + "[]"
                + VALID_WORKFLOW.substring(connectionsEnd + 1);

        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody(workflow)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("WORKFLOW_REQUIREMENTS_NOT_MET"));
    }

    private static String workflowWithParents(String rootParent, String datasetParent) {
        return """
            {
              "version": 2,
              "graph": {
                "entities": [
                  {
                    "id": "root", "name": "Root", "type": "system", "kind": "root",
                    "parent": "%s", "position": {"x": 0, "y": 0}, "width": 800, "height": 600
                  },
                  {
                    "id": "dataset-1", "name": "Dataset", "type": "resource", "kind": "dataset",
                    "parent": "%s", "position": {"x": 100, "y": 100},
                    "ports": [{"id": "out", "direction": "out", "material": "data", "multiple": false}],
                    "version": "v1", "replicas": 1
                  }
                ],
                "connections": [{
                  "id": "dataset-to-root",
                  "from": {"node": "dataset-1", "port": "out"},
                  "to": {"node": "root", "port": "in"}
                }]
              }
            }
            """.formatted(rootParent, datasetParent);
    }

    private String createBody(String workflow) {
        return """
            {
              "author": "author",
              "password": "password",
              "title": "title",
              "body": "body",
              "workflow": %s
            }
            """.formatted(workflow);
    }

    private String updateBody(String workflow) {
        return """
            {
              "password": "password",
              "title": "title",
              "body": "body",
              "workflow": %s
            }
            """.formatted(workflow);
    }
}
