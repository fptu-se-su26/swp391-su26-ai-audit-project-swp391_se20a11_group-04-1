package org.example.backend.dto.testing.config;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME, 
    include = JsonTypeInfo.As.PROPERTY,
    property = "type", 
    visible = true
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = UiTestConfigDto.class, name = "UI"),
    @JsonSubTypes.Type(value = ApiTestConfigDto.class, name = "API"),
    @JsonSubTypes.Type(value = ManualTestConfigDto.class, name = "MANUAL"),
    @JsonSubTypes.Type(value = UnitTestConfigDto.class, name = "UNIT"),
    @JsonSubTypes.Type(value = IntegrationTestConfigDto.class, name = "INTEGRATION")
})
public interface TestConfiguration {
}
