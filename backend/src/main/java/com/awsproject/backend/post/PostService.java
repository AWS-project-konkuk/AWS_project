package com.awsproject.backend.post;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;

@Service
public class PostService {
    private final PostRepository postRepository;
    private final PasswordEncoder passwordEncoder;

    public PostService(PostRepository postRepository, PasswordEncoder passwordEncoder) {
        this.postRepository = postRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Post createPost(String author, String password, String title, String body, JsonNode workflow) {
        String encodedPassword = passwordEncoder.encode(password);
        Post post = new Post(author, encodedPassword, title, body, workflow);
        return postRepository.save(post);
    }

    @Transactional
    public void updatePost(UUID id, String password, String title, String body, JsonNode workflow) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다."));

        boolean isPasswordMatch = post.isPasswordMatch(password, passwordEncoder);
        if (!isPasswordMatch) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비밀번호가 일치하지 않습니다.");
        }
        post.update(title, body, workflow);
    }

    public void deletePost(UUID id, String password) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다."));

        boolean isPasswordMatch = post.isPasswordMatch(password, passwordEncoder);
        if (!isPasswordMatch) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비밀번호가 일치하지 않습니다.");
        }
        postRepository.delete(post);
    }

    public JsonNode getWorkflow(UUID id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다."));
        if (post.getWorkflow() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "워크플로우가 없습니다.");
        }
        return post.getWorkflow();
    }

    @Transactional(readOnly = true)
    public Page<Post> getPosts(Pageable pageable) {
        return postRepository.findAll(pageable);
    }

    @Transactional
    public Post getPost(UUID id) {
        return postRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다."));
    }
}
