package org.example.backend.service.ml;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MlSlaRiskResponse {

    @JsonProperty("risk_level")           private String riskLevel;
    @JsonProperty("risk_probabilities")   private Map<String, Double> riskProbabilities;
    @JsonProperty("penalty_probability")  private double penaltyProbability;
    @JsonProperty("recovery_priority")    private String recoveryPriority;
    @JsonProperty("confidence")           private double confidence;
    @JsonProperty("model_version")        private String modelVersion;
}
