package com.fooddelivery.merchant.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.concurrent.TimeUnit;

/**
 * 智能外卖平台 - 图片代理控制器
 * 目的：代替移动端前端去请求外部图床资源，解决真机调试时的网络限制与防盗链问题。
 */
@RestController
public class ImageProxyController {

    private final RestTemplate restTemplate;

    public ImageProxyController() {
        // 【核心优化】加入连接与读取的超时断路器！
        // 防止由于 Docker 容器无法访问外部网络导致线程永久挂起，从而让移动端永远白屏卡死。
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000); // 3秒连接超时
        factory.setReadTimeout(3000);    // 3秒读取超时
        this.restTemplate = new RestTemplate(factory);
    }

    @GetMapping("/api/images/proxy")
    public ResponseEntity<byte[]> proxyImage(
            @RequestParam String tag,
            @RequestParam int width,
            @RequestParam int height,
            @RequestParam int hash) {
        
        // 【新增排查点】在 Docker 控制台打印明确的请求日志，用于确认前端是否真的发起了请求
        System.out.println("====== 收到前端图片请求: tag=" + tag + ", 尺寸=" + width + "x" + height + " ======");
        
        // 提前设置好成功的响应头（强制缓存7天）
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.setContentType(MediaType.IMAGE_JPEG);
        responseHeaders.setCacheControl("public, max-age=" + TimeUnit.DAYS.toSeconds(7));

        try {
            // 【主图库拉取】使用原生 String 拼接，避免特殊符号被转码导致 404
            String urlString = String.format("https://loremflickr.com/%d/%d/%s?lock=%d", width, height, tag, hash);
            URI targetUrl = URI.create(urlString);
            
            HttpHeaders requestHeaders = new HttpHeaders();
            requestHeaders.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            HttpEntity<String> entity = new HttpEntity<>(requestHeaders);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(targetUrl, HttpMethod.GET, entity, byte[].class);
            System.out.println("--> 主图库拉取成功: " + tag);
            return new ResponseEntity<>(response.getBody(), responseHeaders, HttpStatus.OK);
            
        } catch (Exception e) {
            System.err.println("--> 主图库代理失败，准备拉取备用图: " + e.getMessage()); 
            
            try {
                // 废弃 302 重定向，直接在 Docker 内部下载备用图成字节流返回
                String fallbackUrl = String.format("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=%d&h=%d&fit=crop", width, height);
                
                HttpHeaders fallbackReqHeaders = new HttpHeaders();
                fallbackReqHeaders.set(HttpHeaders.USER_AGENT, "Mozilla/5.0");
                HttpEntity<String> fallbackEntity = new HttpEntity<>(fallbackReqHeaders);
                
                ResponseEntity<byte[]> fallbackResponse = restTemplate.exchange(URI.create(fallbackUrl), HttpMethod.GET, fallbackEntity, byte[].class);
                System.out.println("--> 备用图库拉取成功");
                return new ResponseEntity<>(fallbackResponse.getBody(), responseHeaders, HttpStatus.OK);
                
            } catch (Exception fatalEx) {
                System.err.println("--> 备用图库拉取失败，触发终极像素兜底: " + fatalEx.getMessage());
                
                // 【终极降级方案】直接在内存中返回一张合法的 1x1 灰色空白 JPEG 字节流
                byte[] tinyJpeg = new byte[] {
                    (byte)0xFF, (byte)0xD8, (byte)0xFF, (byte)0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
                    0x00, 0x60, 0x00, 0x00, (byte)0xFF, (byte)0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
                    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C,
                    0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
                    0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, (byte)0xFF, (byte)0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
                    (byte)0xFF, (byte)0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, (byte)0xFF, (byte)0xC4, 0x00, 0x1F, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02,
                    0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
                    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, (byte)0xFF, (byte)0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, (byte)0xFF, (byte)0xD9
                };
                return new ResponseEntity<>(tinyJpeg, responseHeaders, HttpStatus.OK);
            }
        }
    }
}