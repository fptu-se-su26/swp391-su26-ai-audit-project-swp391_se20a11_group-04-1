package org.example.backend.dto.admin.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KubernetesStatusResponse {
    private List<PodInfo> pods;
    private KedaScalerInfo scaler;
    private String status;
}
