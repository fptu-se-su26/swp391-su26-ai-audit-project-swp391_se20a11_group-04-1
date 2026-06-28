package org.example.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.exception.BusinessException;
import org.example.backend.service.impl.GeminiServiceImpl;
import org.example.backend.service.impl.GroqProvider;
import org.example.backend.service.impl.OpenRouterProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class AiRoutingService {

    private final List<LlmProvider> providers;

    @Autowired
    public AiRoutingService(GeminiServiceImpl gemini, OpenRouterProvider openRouter, GroqProvider groq) {
        this.providers = new ArrayList<>();
        // Thứ tự ưu tiên: Gemini -> OpenRouter -> Groq
        providers.add(gemini);
        providers.add(openRouter);
        providers.add(groq);
    }

    public String generateText(String prompt) {
        List<String> errors = new ArrayList<>();

        for (LlmProvider provider : providers) {
            try {
                log.info("Đang thử gọi AI Provider: {}", provider.getProviderName());
                return provider.generateText(prompt);
            } catch (Exception e) {
                // Lỗi BusinessException (thiếu key, v.v) hoặc lỗi bất ngờ
                String errMsg = String.format("Provider %s thất bại: %s", provider.getProviderName(), e.getMessage());
                log.warn(errMsg);
                errors.add(errMsg);
                // Tiếp tục vòng lặp để chuyển sang provider tiếp theo
            }
        }

        // Nếu tất cả provider đều sụp đổ
        throw new BusinessException("Tất cả các AI Providers đều thất bại!\nChi tiết lỗi:\n" + String.join("\n", errors));
    }
}
