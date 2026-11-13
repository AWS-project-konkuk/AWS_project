package com.awsproject.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.awsproject.backend.post.Post;
import com.awsproject.backend.post.PostController;
import com.awsproject.backend.post.PostService;

@WebMvcTest(PostController.class)
class PostListApiTests {

    @Autowired WebApplicationContext context;
    @MockitoBean PostService postService;
    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void returnsPageResponse() throws Exception {
        Post post = new Post("작성자", "hashed-password", "제목", "본문");
        when(postService.getPosts(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(post), PageRequest.of(0, 30), 1));

        mvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("제목"))
                .andExpect(jsonPath("$.content[0].password").doesNotExist())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(30))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.hasNext").value(false));
    }

    @Test
    void capsPageSizeAndIgnoresClientSort() throws Exception {
        when(postService.getPosts(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        mvc.perform(get("/api/posts").param("page", "2").param("size", "1000").param("sort", "password,asc"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(postService).getPosts(captor.capture());
        Pageable used = captor.getValue();
        assertEquals(2, used.getPageNumber());
        assertEquals(30, used.getPageSize());
        assertNull(used.getSort().getOrderFor("password"));
        assertEquals(Sort.Direction.DESC, used.getSort().getOrderFor("createdAt").getDirection());
        assertEquals(Sort.Direction.DESC, used.getSort().getOrderFor("id").getDirection());
    }
}
