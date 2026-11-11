package com.awsproject.backend.post;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, UUID> {
    
}
