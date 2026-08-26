package com.medical.labservice.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Forwards the caller's bearer token on outbound Feign calls.
 *
 * Downstream services validate JWTs themselves, so a call made without a token
 * is rejected with 401. Propagating the incoming Authorization header keeps the
 * original caller's identity, and therefore their permissions, intact across
 * the hop rather than granting this service blanket access.
 *
 * When there is no request in scope (a scheduled job, a startup probe) nothing
 * is added and the downstream call is simply unauthenticated.
 */
@Configuration
public class FeignAuthPropagationConfig {

    @Bean
    public RequestInterceptor bearerTokenPropagationInterceptor() {
        return template -> {
            if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
                return;
            }
            String authorization = attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
            if (authorization != null && !authorization.isBlank()
                    && !template.headers().containsKey(HttpHeaders.AUTHORIZATION)) {
                template.header(HttpHeaders.AUTHORIZATION, authorization);
            }
        };
    }
}
