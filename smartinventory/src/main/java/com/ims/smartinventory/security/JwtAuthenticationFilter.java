package com.ims.smartinventory.security;

import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final List<String> PUBLIC_PATHS = Arrays.asList(
            "/auth/login",
            "/auth/register",
            "/auth/register-with-image"
    );

    @Autowired
    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Log full request details for debugging
        String method = request.getMethod();
        String path = request.getRequestURI();
        String servletPath = request.getServletPath();
        String contentType = request.getContentType();

        System.out.println("------ Request Details ------");
        System.out.println("Method: " + method);
        System.out.println("Request URI: " + path);
        System.out.println("Servlet Path: " + servletPath);
        System.out.println("Content-Type: " + contentType);

        final String authorizationHeader = request.getHeader("Authorization");
        System.out.println("Authorization header: " + (authorizationHeader != null ? "present" : "absent"));
        System.out.println("----------------------------");

        // Skip authentication for OPTIONS requests (preflight CORS)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            System.out.println("OPTIONS request detected, skipping authentication");
            filterChain.doFilter(request, response);
            return;
        }

        String userId = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                userId = jwtUtil.extractUserId(jwt);
                System.out.println("Extracted user ID from token: " + userId);
            } catch (ExpiredJwtException e) {
                System.out.println("Token has expired: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has expired");
                return;
            } catch (Exception e) {
                System.out.println("Invalid token: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid token");
                return;
            }
        } else {
            System.out.println("No valid Authorization header found");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Authorization header required");
            return;
        }

        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserEntity user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                // Debug output
                System.out.println("JWT Authentication - User found: " + user.getUsername());
                System.out.println("JWT Authentication - User role: " + user.getRole());

                // Check if token is valid for this user
                if (!jwtUtil.validateToken(jwt, user.getId())) {
                    System.out.println("Token is not valid for user: " + user.getId());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Invalid token for user");
                    return;
                }

                // Use the authorities from the user entity
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                System.out.println("Authentication successful for user: " + user.getUsername());
                filterChain.doFilter(request, response);
            } catch (Exception e) {
                System.err.println("Error authenticating user: " + e.getMessage());
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Authentication error: " + e.getMessage());
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Strip out servlet path prefix for matching
        String contextPath = "/api";
        if (path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }

        // Check if it's a public path that doesn't need authentication
        for (String publicPath : PUBLIC_PATHS) {
            if (path.startsWith(publicPath)) {
                System.out.println("Public path detected, skipping authentication: " + path);
                return true;
            }
        }

        return false;
    }
}