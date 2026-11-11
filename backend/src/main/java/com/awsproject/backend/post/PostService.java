package com.awsproject.backend.post;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
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
    
}
