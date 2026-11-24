package com.awsproject.backend.post.validation;

import java.util.HashSet;
import java.util.Set;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import tools.jackson.databind.JsonNode;

public class WorkflowValidator implements ConstraintValidator<ValidWorkflow, JsonNode> {
    private static final int MAX_ENTITIES = 200;
    private static final int MAX_CONNECTIONS = 500;
    private static final int MAX_ID_LENGTH = 100;
    private static final int MAX_NAME_LENGTH = 63;

    @Override
    public boolean isValid(JsonNode workflow, ConstraintValidatorContext context) {
        // The frontend sends null when no playground workflow is attached.
        if (workflow == null || workflow.isNull()) {
            return true;
        }
        if (!workflow.isObject()) {
            return false;
        }

        JsonNode version = workflow.get("version");
        JsonNode graph = workflow.get("graph");
        if (version == null || !version.isIntegralNumber()
                || graph == null || !graph.isObject()) {
            return false;
        }

        JsonNode entities = graph.get("entities");
        JsonNode connections = graph.get("connections");
        if (entities == null || !entities.isArray() || entities.size() > MAX_ENTITIES
                || connections == null || !connections.isArray()
                || connections.size() > MAX_CONNECTIONS) {
            return false;
        }

        Set<String> entityIds = new HashSet<>();
        for (JsonNode entity : entities) {
            if (!isValidEntity(entity, entityIds)) {
                return false;
            }
        }

        Set<String> connectionIds = new HashSet<>();
        for (JsonNode connection : connections) {
            if (!isValidConnection(connection, entityIds, connectionIds)) {
                return false;
            }
        }
        return true;
    }

    private boolean isValidEntity(JsonNode entity, Set<String> entityIds) {
        if (entity == null || !entity.isObject()
                || !hasText(entity, "id", MAX_ID_LENGTH)
                || !hasText(entity, "name", MAX_NAME_LENGTH)
                || !hasText(entity, "type", 20)
                || !hasText(entity, "kind", MAX_ID_LENGTH)) {
            return false;
        }
        // The frontend's root entity has no parent and sends an empty string.
        // Every other entity must name its parent.
        boolean root = "root".equals(entity.get("kind").asText());
        if (root ? !isRootParent(entity.get("parent")) : !hasText(entity, "parent", MAX_ID_LENGTH)) {
            return false;
        }

        String id = entity.get("id").asText();
        if (!entityIds.add(id) || !isPoint(entity.get("position"))) {
            return false;
        }

        String type = entity.get("type").asText();
        if ("system".equals(type)) {
            return isFiniteNumber(entity.get("width"))
                    && entity.get("width").asDouble() >= 0
                    && isFiniteNumber(entity.get("height"))
                    && entity.get("height").asDouble() >= 0
                    && isOptionalPortsArray(entity.get("ports"));
        }
        if ("resource".equals(type)) {
            return isPortsArray(entity.get("ports"))
                    && hasText(entity, "version", 10)
                    && entity.get("replicas") != null
                    && entity.get("replicas").isIntegralNumber()
                    && entity.get("replicas").asInt() >= 0;
        }
        return false;
    }

    private boolean isValidConnection(
            JsonNode connection,
            Set<String> entityIds,
            Set<String> connectionIds
    ) {
        if (connection == null || !connection.isObject()
                || !hasText(connection, "id", 300)) {
            return false;
        }
        if (!connectionIds.add(connection.get("id").asText())) {
            return false;
        }

        JsonNode from = connection.get("from");
        JsonNode to = connection.get("to");
        return isEndpoint(from, entityIds) && isEndpoint(to, entityIds);
    }

    private boolean isEndpoint(JsonNode endpoint, Set<String> entityIds) {
        return endpoint != null
                && endpoint.isObject()
                && hasText(endpoint, "node", MAX_ID_LENGTH)
                && hasText(endpoint, "port", MAX_ID_LENGTH)
                && entityIds.contains(endpoint.get("node").asText());
    }

    private boolean isPoint(JsonNode point) {
        return point != null
                && point.isObject()
                && isFiniteNumber(point.get("x"))
                && isFiniteNumber(point.get("y"));
    }

    private boolean isOptionalPortsArray(JsonNode ports) {
        return ports == null || isPortsArray(ports);
    }

    private boolean isPortsArray(JsonNode ports) {
        if (ports == null || !ports.isArray()) {
            return false;
        }
        Set<String> portIds = new HashSet<>();
        for (JsonNode port : ports) {
            if (port == null || !port.isObject()
                    || !hasText(port, "id", MAX_ID_LENGTH)
                    || !hasText(port, "direction", 10)
                    || !hasText(port, "material", MAX_ID_LENGTH)
                    || port.get("multiple") == null
                    || !port.get("multiple").isBoolean()) {
                return false;
            }
            String direction = port.get("direction").asText();
            if (!("in".equals(direction) || "out".equals(direction))
                    || !portIds.add(port.get("id").asText())) {
                return false;
            }
        }
        return true;
    }

    private boolean isRootParent(JsonNode parent) {
        return parent != null && parent.isTextual() && parent.asText().length() <= MAX_ID_LENGTH;
    }

    private boolean hasText(JsonNode object, String field, int maxLength) {
        JsonNode value = object.get(field);
        return value != null
                && value.isTextual()
                && !value.asText().isBlank()
                && value.asText().length() <= maxLength;
    }

    private boolean isFiniteNumber(JsonNode value) {
        return value != null && value.isNumber() && Double.isFinite(value.asDouble());
    }
}
