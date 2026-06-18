package org.example.backend.mapper;

import org.example.backend.dto.testing.TestRunResponse;
import org.example.backend.dto.testing.internal.TestRunExecutionPlan;
import org.example.backend.entity.TestExecution;
import org.example.backend.entity.TestRun;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TestRunMapper {

    public TestRunResponse toResponse(TestRun testRun) {
        return new TestRunResponse(
            testRun.getId(),
            testRun.getStatus().name(),
            testRun.getCorrelationId()
        );
    }

    public TestRunExecutionPlan toExecutionPlan(TestRun testRun, List<TestExecution> executions) {
        List<TestRunExecutionPlan.ExecutionItem> items = executions.stream().map(exec -> {
            List<TestRunExecutionPlan.StepItem> stepItems = List.of();
            if (exec.getTestCase() != null && exec.getTestCase().getSteps() != null) {
                stepItems = exec.getTestCase().getSteps().stream().map(step -> 
                    new TestRunExecutionPlan.StepItem(
                        step.getId(),
                        step.getStepNumber() != null ? step.getStepNumber() : 0,
                        step.getDescription(),
                        null, // inputData not available in TestStep
                        null  // expectedResult not available in TestStep
                    )
                ).toList();
            }
            return new TestRunExecutionPlan.ExecutionItem(
                exec.getId(),
                exec.getTestCase() != null ? exec.getTestCase().getId() : null,
                exec.getTestCase() != null ? exec.getTestCase().getTitle() : null,
                exec.getStatus().name(),
                exec.getOrderIndex(),
                stepItems
            );
        }).toList();

        return new TestRunExecutionPlan(
            testRun.getId(),
            testRun.getCorrelationId(),
            items
        );
    }
}
