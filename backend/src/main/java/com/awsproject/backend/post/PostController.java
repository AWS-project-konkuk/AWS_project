package com.awsproject.backend.post;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import com.awsproject.backend.post.DTO.PageResponse;
import com.awsproject.backend.post.DTO.PostDetailResponse;
import com.awsproject.backend.post.DTO.UpdatePostRequest;

import jakarta.validation.Valid;
import tools.jackson.databind.JsonNode;

@RestController 
@RequestMapping ("/api/posts")
public class PostController {

    private static final Sort POST_LIST_SORT =
        Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));

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
    public ResponseEntity<PageResponse<AllPostResponse>> getPosts(Pageable pageable) {
        // 클라이언트의 sort 파라미터는 무시하고 서버에서 정렬 기준을 고정한다.
        Pageable fixed = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), POST_LIST_SORT);
        Page<AllPostResponse> page = postService.getPosts(fixed).map(AllPostResponse::from);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDetailResponse> getPost(@PathVariable UUID id) {
        Post post = postService.getPost(id);
        return ResponseEntity.ok(PostDetailResponse.from(post));
    }

    
}
