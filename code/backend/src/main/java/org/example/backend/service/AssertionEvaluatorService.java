package org.example.backend.service;

import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.apitest.AssertionDto;
import org.example.backend.dto.apitest.AssertionResultDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AssertionEvaluatorService {

    public List<AssertionResultDto> evaluate(
            List<AssertionDto> assertions,
            int statusCode,
            int responseTimeMs,
            Map<String, String> responseHeaders,
            String responseBody) {

        List<AssertionResultDto> results = new ArrayList<>();
        if (assertions == null || assertions.isEmpty()) {
            return results;
        }

        for (AssertionDto assertion : assertions) {
            AssertionResultDto result = new AssertionResultDto();
            result.setAssertion(assertion);
            
            try {
                switch (assertion.getType().toUpperCase()) {
                    case "STATUS_CODE":
                        evaluateStatusCode(assertion, statusCode, result);
                        break;
                    case "RESPONSE_TIME":
                        evaluateResponseTime(assertion, responseTimeMs, result);
                        break;
                    case "HEADER":
                        evaluateHeader(assertion, responseHeaders, result);
                        break;
                    case "JSON_PATH":
                        evaluateJsonPath(assertion, responseBody, result);
                        break;
                    default:
                        fail(result, "Unknown assertion type: " + assertion.getType(), null);
                }
            } catch (Exception e) {
                log.error("Error evaluating assertion: {}", assertion, e);
                fail(result, "Error evaluating assertion: " + e.getMessage(), null);
            }
            results.add(result);
        }

        return results;
    }

    private void evaluateStatusCode(AssertionDto assertion, int statusCode, AssertionResultDto result) {
        String actual = String.valueOf(statusCode);
        compare(assertion, actual, result);
    }

    private void evaluateResponseTime(AssertionDto assertion, int responseTimeMs, AssertionResultDto result) {
        String actual = String.valueOf(responseTimeMs);
        compare(assertion, actual, result);
    }

    private void evaluateHeader(AssertionDto assertion, Map<String, String> responseHeaders, AssertionResultDto result) {
        String property = assertion.getProperty();
        String actual = null;

        if (responseHeaders != null) {
            // Case-insensitive search
            for (Map.Entry<String, String> entry : responseHeaders.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(property)) {
                    actual = entry.getValue();
                    break;
                }
            }
        }

        if (actual == null) {
            if ("EXISTS".equalsIgnoreCase(assertion.getOperator())) {
                fail(result, "Header not found", null);
            } else {
                fail(result, "Header not found: " + property, null);
            }
            return;
        }
        
        compare(assertion, actual, result);
    }

    private void evaluateJsonPath(AssertionDto assertion, String responseBody, AssertionResultDto result) {
        if (responseBody == null || responseBody.isBlank()) {
            fail(result, "Response body is empty", null);
            return;
        }

        try {
            Object jsonResult = JsonPath.read(responseBody, assertion.getProperty());
            String actual = jsonResult != null ? jsonResult.toString() : null;
            compare(assertion, actual, result);
        } catch (PathNotFoundException e) {
            if ("EXISTS".equalsIgnoreCase(assertion.getOperator())) {
                fail(result, "Path not found in JSON", null);
            } else {
                fail(result, "Path not found: " + assertion.getProperty(), null);
            }
        }
    }

    private void compare(AssertionDto assertion, String actual, AssertionResultDto result) {
        String expected = assertion.getExpectedValue();
        String operator = assertion.getOperator() != null ? assertion.getOperator().toUpperCase() : "EQUALS";
        
        result.setActualValue(actual);

        boolean passed = false;
        String errorMessage = null;

        try {
            switch (operator) {
                case "EQUALS":
                    passed = expected != null && expected.equals(actual);
                    if (!passed) errorMessage = String.format("Expected '%s' but got '%s'", expected, actual);
                    break;
                case "CONTAINS":
                    passed = actual != null && expected != null && actual.contains(expected);
                    if (!passed) errorMessage = String.format("Expected '%s' to contain '%s'", actual, expected);
                    break;
                case "GREATER_THAN":
                    passed = Double.parseDouble(actual) > Double.parseDouble(expected);
                    if (!passed) errorMessage = String.format("Expected %s > %s", actual, expected);
                    break;
                case "LESS_THAN":
                    passed = Double.parseDouble(actual) < Double.parseDouble(expected);
                    if (!passed) errorMessage = String.format("Expected %s < %s", actual, expected);
                    break;
                case "EXISTS":
                    passed = actual != null;
                    if (!passed) errorMessage = "Expected property to exist but it did not";
                    break;
                default:
                    errorMessage = "Unknown operator: " + operator;
            }
        } catch (NumberFormatException e) {
            passed = false;
            errorMessage = "Failed to parse numeric value for comparison";
        }

        if (passed) {
            pass(result, actual);
        } else {
            fail(result, errorMessage, actual);
        }
    }

    private void pass(AssertionResultDto result, String actual) {
        result.setPassed(true);
        result.setActualValue(actual);
        result.setErrorMessage(null);
    }

    private void fail(AssertionResultDto result, String errorMessage, String actual) {
        result.setPassed(false);
        result.setErrorMessage(errorMessage);
        if (actual != null) {
            result.setActualValue(actual);
        }
    }
}
