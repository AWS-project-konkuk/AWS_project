package com.awsproject.backend.post;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.awsproject.backend.post.DTO.CreatePostRequest;
import com.awsproject.backend.post.DTO.CreatePostResponse;
import com.awsproject.backend.post.DTO.UpdatePostRequest;

import jakarta.validation.Valid;

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

    
}
