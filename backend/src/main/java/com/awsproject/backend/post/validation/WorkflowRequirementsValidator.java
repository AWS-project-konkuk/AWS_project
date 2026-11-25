package com.awsproject.backend.post.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import tools.jackson.databind.JsonNode;

public class WorkflowRequirementsValidator
        implements ConstraintValidator<ValidWorkflowRequirements, JsonNode> {
    private static final int MIN_ENTITIES = 2;
    private static final int MIN_CONNECTIONS = 1;

    @Override
    public boolean isValid(JsonNode workflow, ConstraintValidatorContext context) {
        if (workflow == null || workflow.isNull()) {
            return false;
        }

        // JSON 구조 오류는 기존 @ValidWorkflow가 400으로 처리하도록 위임한다.
        if (!workflow.isObject()) {
            return true;
        }

        JsonNode graph = workflow.get("graph");
        if (graph == null || !graph.isObject()) {
            return true;
        }

        JsonNode entities = graph.get("entities");
        JsonNode connections = graph.get("connections");
        if (entities == null || !entities.isArray()
                || connections == null || !connections.isArray()) {
            return true;
        }

        return entities.size() >= MIN_ENTITIES
                && connections.size() >= MIN_CONNECTIONS;
    }
}
