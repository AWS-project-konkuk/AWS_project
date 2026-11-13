package com.awsproject.backend.post;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.awsproject.backend.post.DTO.AllPostResponse;
import com.awsproject.backend.post.DTO.CreatePostRequest;
import com.awsproject.backend.post.DTO.CreatePostResponse;
import com.awsproject.backend.post.DTO.DeletePostRequest;
import com.awsproject.backend.post.DTO.UpdatePostRequest;
import com.awsproject.backend.post.DTO.PostDetailResponse;

import jakarta.validation.Valid;
import tools.jackson.databind.JsonNode;

@RestController 
@RequestMapping ("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping 
    public ResponseEntity createPost(
        @Valid @RequestBody CreatePostRequest request){
        Post savedPost = postService.createPost(request.author(), request.password(), request.title(), request.body(), request.workflow());
        CreatePostResponse response = new CreatePostResponse(
            savedPost.getId(), 
            savedPost.getAuthor(), 
            savedPost.getTitle(), 
            savedPost.getCreatedAt());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> updatePost(
        @PathVariable UUID id,
        @Valid @RequestBody UpdatePostRequest request
    ){
        postService.updatePost(id, request.password(), request.title(), request.body(), request.workflow());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
        @PathVariable UUID id,
        @Valid @RequestBody DeletePostRequest request
    ){
        postService.deletePost(id, request.password());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/workflow")
    public ResponseEntity<JsonNode> getWorkflow(@PathVariable UUID id) {
        JsonNode workflow = postService.getWorkflow(id);
        return ResponseEntity.ok(workflow);
    }

    @GetMapping 
    public ResponseEntity<List<AllPostResponse>> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        List<AllPostResponse> response = posts.stream()
            .map(post -> new AllPostResponse(
                post.getId(),
                post.getAuthor(), 
                post.getTitle(), 
                post.getCreatedAt(), 
                post.getUpdatedAt(), 
                post.getWorkflow()
            ))
            .toList();
            return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDetailResponse> getPost(@PathVariable UUID id) {
        Post post = postService.getPost(id);
        return ResponseEntity.ok(PostDetailResponse.from(post));
    }

    
}
