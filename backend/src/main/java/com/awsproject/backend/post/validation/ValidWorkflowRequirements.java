package com.awsproject.backend.post.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = WorkflowRequirementsValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidWorkflowRequirements {
    String message() default "워크플로우에는 엔티티가 2개 이상, 연결이 1개 이상 필요합니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
